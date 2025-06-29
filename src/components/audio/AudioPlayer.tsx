// src/components/audio/AudioPlayer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  Music,
  Radio,
  Disc3,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import WaveformVisualizer from "./WaveformVisualizer";
import { formatTime } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileUrl: string;
  genre?: string;
}

interface AudioPlayerProps {
  tracks: Track[];
  initialTrackIndex?: number;
  onTrackChange?: (track: Track, index: number) => void;
}

export default function AudioPlayer({
  tracks,
  initialTrackIndex = 0,
  onTrackChange,
}: AudioPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [showVisualizer] = useState(true);

  const currentTrack = tracks[currentTrackIndex];

  const { state, load, play, pause, seek, setVolume, toggleMute } =
    useAudioPlayer({
      onEnd: () => handleNextTrack(),
      onError: (error) => console.error("Audio error:", error),
    });

  // Carregar faixa atual
  useEffect(() => {
    if (currentTrack?.fileUrl) {
      load(`/api/tracks/${currentTrack.id}/stream`);
      onTrackChange?.(currentTrack, currentTrackIndex);
    }
  }, [currentTrack, load, currentTrackIndex, onTrackChange]);

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handlePreviousTrack = () => {
    const newIndex =
      currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    setCurrentTrackIndex(newIndex);
  };

  const handleNextTrack = () => {
    const newIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(newIndex);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const newTime = percentage * state.duration;
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        className="relative bg-black/50 backdrop-blur-2xl rounded-3xl p-8 border border-purple-500/30 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
          boxShadow:
            "0 0 100px rgba(236, 72, 153, 0.3), inset 0 0 50px rgba(168, 85, 247, 0.1)",
        }}
      >
        {/* Holographic Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
        </div>

        {/* Track Info */}
        <div className="relative z-10 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.h3
                key={currentTrack?.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white mb-2 flex items-center gap-3"
              >
                <Music className="w-8 h-8 text-pink-500" />
                {currentTrack?.title || "No track loaded"}
              </motion.h3>

              <div className="flex items-center gap-4 text-gray-400">
                <span className="text-lg">{currentTrack?.artist}</span>
                {currentTrack?.genre && (
                  <>
                    <span className="text-purple-300">•</span>
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs font-semibold text-purple-300 border border-purple-500/30">
                      {currentTrack.genre}
                    </span>
                  </>
                )}
              </div>
            </div>

            <motion.div
              animate={{ rotate: state.isPlaying ? 360 : 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0"
            >
              <Disc3
                className={`w-12 h-12 ${
                  state.isPlaying ? "text-pink-500" : "text-gray-500"
                }`}
              />
            </motion.div>
          </div>
        </div>

        {/* Waveform Visualizer */}
        {showVisualizer && currentTrack && (
          <div className="mb-6">
            <WaveformVisualizer
              audioUrl={`/api/tracks/${currentTrack.id}/stream`}
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              duration={state.duration}
              onSeek={seek}
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div
            className="relative h-2 bg-gray-800 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-500"
              style={{
                width: `${(state.currentTime / state.duration) * 100}%`,
              }}
              transition={{ duration: 0.1 }}
            />

            {/* Glow Effect */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
              style={{
                left: `${(state.currentTime / state.duration) * 100}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.8)",
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Track Controls */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePreviousTrack}
              className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50 transition-all"
            >
              <SkipBack size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              disabled={state.isLoading}
              className="p-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 relative group overflow-hidden disabled:opacity-50"
              style={{
                boxShadow:
                  "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
              }}
            >
              <AnimatePresence mode="wait">
                {state.isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Loader2 size={28} className="animate-spin" />
                  </motion.div>
                ) : state.isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Pause size={28} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Play size={28} className="ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulse Animation */}
              {state.isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-full"
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNextTrack}
              className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50 transition-all"
            >
              <SkipForward size={20} />
            </motion.button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30"
            >
              {state.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>

            <div className="relative w-32">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.isMuted ? 0 : state.volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer volume-slider"
              />
            </div>

            {state.isPlaying && (
              <div className="flex items-center gap-1 ml-4">
                <Radio className="w-5 h-5 text-pink-500 animate-pulse" />
                <span className="text-xs text-pink-400 font-mono">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Track List */}
        <div className="mt-8 space-y-2">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              whileHover={{ x: 10, scale: 1.02 }}
              onClick={() => setCurrentTrackIndex(index)}
              className={`p-4 rounded-xl cursor-pointer transition-all relative overflow-hidden group ${
                currentTrackIndex === index
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40"
                  : "hover:bg-gradient-to-r hover:from-gray-800/30 hover:to-gray-900/30 border border-transparent hover:border-purple-500/20"
              }`}
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={
                      currentTrackIndex === index && state.isPlaying
                        ? { rotate: 360 }
                        : {}
                    }
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Disc3
                      className={`w-5 h-5 ${
                        currentTrackIndex === index
                          ? "text-pink-500"
                          : "text-gray-500"
                      }`}
                    />
                  </motion.div>
                  <div>
                    <span className="font-semibold">{track.title}</span>
                    <span className="text-gray-400 text-sm ml-3">
                      {track.genre}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">
                    {formatTime(track.duration)}
                  </span>
                  {currentTrackIndex === index && state.isPlaying && (
                    <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style jsx>{`
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
        }

        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
