// src/components/audio/WaveformVisualizer.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function WaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}: WaveformVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Criar instância do WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(236, 72, 153, 0.6)",
      progressColor: "rgba(168, 85, 247, 0.8)",
      cursorColor: "#ffffff",
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 80,
      normalize: true,
      backend: "WebAudio",
      interact: true,
      fillParent: true,
      hideScrollbar: true,
      minPxPerSec: 50,
      autoScroll: true,
      autoCenter: true,
    });

    // Eventos
    wavesurfer.on("ready", () => {
      setIsLoading(false);
      const peaks = wavesurfer.getDecodedData()?.getChannelData(0);
      if (peaks) {
        setPeaks(Array.from(peaks));
      }
    });

    wavesurfer.on("click", (relativeX) => {
      const clickTime = relativeX * duration;
      onSeek(clickTime);
    });

    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsLoading(false);
    });

    // Carregar áudio
    wavesurfer.load(audioUrl);
    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, duration, onSeek]);

  // Sincronizar posição
  useEffect(() => {
    if (wavesurferRef.current && duration > 0) {
      const progress = currentTime / duration;
      wavesurferRef.current.seekTo(progress);
    }
  }, [currentTime, duration]);

  // Renderização alternativa com barras animadas
  const renderAnimatedBars = () => {
    return (
      <div className="h-20 flex items-center justify-center gap-1">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full origin-bottom"
            animate={{
              height: isPlaying ? [10, 20 + (i % 5) * 12, 10] : 10,
              opacity: isPlaying ? [0.6, 1, 0.6] : 0.6,
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.02,
            }}
            style={{
              boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative h-24 rounded-xl bg-black/30 border border-purple-500/20 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: isLoading ? "none" : "block" }}
      />

      {/* Fallback para visualização sem WaveSurfer */}
      {!audioUrl && renderAnimatedBars()}

      {/* Overlay com efeito de scan */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute h-full w-[2px] bg-gradient-to-b from-transparent via-white/50 to-transparent"
          animate={{
            x: ["-2px", "calc(100% + 2px)"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
}
