"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import {
  Play,
  Pause,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Mail,
  Instagram,
  Twitter,
  Youtube,
  Volume2,
  VolumeX,
  Disc3,
  Music,
  Zap,
  Radio,
  User,
  ShoppingCart,
} from "lucide-react";
import AuthModal from "./AuthModal";
import { useCart } from "@/hooks/useCart";

const LAOSLandingPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { scrollY } = useScroll();
  const { itemCount } = useCart();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const parallaxY = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.5]);

  useEffect(() => {
    setMounted(true);
    // Check for GPU acceleration support
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    setGpuEnabled(!!gl);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    if (mounted) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [mouseX, mouseY, mounted]);

  const tracks = [
    { title: "Broken Mirrors", duration: "3:45", url: "#", genre: "Synthwave" },
    { title: "Neon Shadows", duration: "4:12", url: "#", genre: "Darkwave" },
    { title: "Last Breath", duration: "3:58", url: "#", genre: "Cyberpunk" },
  ];

  const shows = [
    {
      date: "2025-07-15",
      venue: "The Vortex Club",
      city: "São Paulo",
      ticketUrl: "#",
      soldOut: false,
    },
    {
      date: "2025-07-22",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      ticketUrl: "#",
      soldOut: false,
    },
    {
      date: "2025-08-05",
      venue: "Dark Matter",
      city: "Belo Horizonte",
      ticketUrl: "#",
      soldOut: true,
    },
  ];

  const albums = [
    {
      title: "Cyber Rebellion",
      year: 2024,
      tracks: 12,
      spotifyUrl: "#",
      theme: "rebellion",
    },
    {
      title: "Neon Dreams",
      year: 2023,
      tracks: 10,
      spotifyUrl: "#",
      theme: "dreams",
    },
    {
      title: "Digital Void",
      year: 2022,
      tracks: 14,
      spotifyUrl: "#",
      theme: "void",
    },
  ];

  const photos = [
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
  ];

  // GPU Accelerated Wrapper Component
  const GPUAccelerated = ({
    children,
    className = "",
    style = {},
  }: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => {
    return (
      <div
        className={`gpu-accelerated ${className}`}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          perspective: 1000,
          ...style,
        }}
      >
        {children}
      </div>
    );
  };

  const FloatingParticles = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const randomX = i * 33 + 100;
          const randomY = i * 28 + 50;
          const randomDuration = 20 + (i % 10) * 2;
          const randomOpacity = 0.5 + (i % 5) * 0.1;

          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-pink-500 rounded-full gpu-accelerated"
              initial={{
                x: randomX,
                y: randomY,
                opacity: randomOpacity,
              }}
              animate={{
                x: [randomX, randomX + 200, randomX],
                y: [randomY, randomY + 100, randomY],
                transition: {
                  duration: randomDuration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear",
                },
              }}
              style={{
                filter: "blur(1px)",
                boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)",
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
          );
        })}
      </div>
    );
  };

  const GlowingGrid = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none gpu-accelerated">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            transform: "perspective(500px) rotateX(60deg) translateZ(0)",
            transformOrigin: "center center",
            willChange: "transform",
          }}
        />
      </div>
    );
  };

  // Performance Monitor Component (for debug - hidden by default)
  const PerformanceMonitor = () => {
    const [fps, setFps] = useState(60);
    const [showMonitor] = useState(false); // Set to true for debugging

    useEffect(() => {
      if (!showMonitor) return;

      let lastTime = performance.now();
      let frames = 0;

      const updateFPS = () => {
        frames++;
        const currentTime = performance.now();

        if (currentTime >= lastTime + 1000) {
          setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
          frames = 0;
          lastTime = currentTime;
        }

        requestAnimationFrame(updateFPS);
      };

      const rafId = requestAnimationFrame(updateFPS);
      return () => cancelAnimationFrame(rafId);
    }, [showMonitor]);

    if (!showMonitor) return null;

    return (
      <div className="fixed top-4 right-4 bg-black/80 text-green-400 px-4 py-2 rounded-lg font-mono text-sm z-50 backdrop-blur-sm border border-green-500/30">
        <div>FPS: {fps}</div>
        <div>GPU: {gpuEnabled ? "Enabled" : "Disabled"}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <PerformanceMonitor />
      <FloatingParticles />

      {/* Header com botão de login */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/30 border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-6 h-6 text-pink-500" />
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              LAOS
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Products Link */}
            <motion.a
              href="/products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full backdrop-blur-xl border border-purple-500/30 hover:border-pink-500/50 transition-all"
              style={{
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-semibold">PRODUTOS</span>
              {itemCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-xs font-bold text-white">{itemCount}</span>
                </motion.div>
              )}
            </motion.a>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full backdrop-blur-xl border border-purple-500/30 hover:border-pink-500/50 transition-all"
              style={{
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)",
              }}
            >
              <User className="w-4 h-4" />
              <span className="font-semibold">LOGIN</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Futuristic Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <GlowingGrid />

        <motion.div
          style={{ y: parallaxY, scale }}
          className="absolute inset-0 z-0 gpu-accelerated"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black" />

          {/* Static gradient background - sem rotação */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] gpu-accelerated">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[200px]" />
            <div className="absolute inset-20 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute inset-40 bg-gradient-to-r from-pink-500/40 to-purple-500/40 rounded-full blur-[100px] animate-pulse delay-500" />
          </div>

          {/* Cyberpunk lines */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent gpu-accelerated"
              style={{
                top: `${20 + i * 15}%`,
                transform: "translateZ(0)",
                willChange: "transform, opacity",
              }}
              animate={{
                x: [-1000, 1000],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "linear",
              }}
            />
          ))}
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="relative z-10 text-center px-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, type: "spring", damping: 15 }}
            className="relative inline-block mb-8 gpu-accelerated"
            style={{ willChange: "transform" }}
          >
            <motion.div
              animate={{
                opacity: [0.3, 1, 0.3, 1, 1, 0.3, 1],
                filter: [
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                  "brightness(1) blur(0px)",
                  "brightness(3) blur(2px)",
                  "brightness(1.5) blur(0px)",
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 2,
                times: [0, 0.1, 0.2, 0.3, 0.4, 0.7, 1],
              }}
              className="absolute top-1/2 -left-16 md:-left-24 -translate-y-1/2 gpu-accelerated"
              style={{
                transform: "translate3d(0, -50%, 0)",
                willChange: "opacity, filter",
              }}
            >
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,1)]" />
            </motion.div>

            <motion.div
              animate={{
                opacity: [0.3, 1, 0.3, 1, 1, 0.3, 1],
                filter: [
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                  "brightness(1) blur(0px)",
                  "brightness(3) blur(2px)",
                  "brightness(1.5) blur(0px)",
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                ],
                x: [0, -2, 2, -1, 1, 0, 0],
                y: [0, 1, -1, 1, -1, 0, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 2,
                delay: 0.4,
                times: [0, 0.1, 0.2, 0.3, 0.4, 0.7, 1],
              }}
              className="absolute top-1/2 -right-16 md:-right-24 -translate-y-1/2 gpu-accelerated"
              style={{
                transform: "translate3d(0, -50%, 0)",
                willChange: "opacity, filter, transform",
              }}
            >
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,1)]" />
            </motion.div>

            <h1 className="text-8xl md:text-[12rem] font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 relative gpu-accelerated">
              LAOS
              <div className="absolute inset-0 blur-[50px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-50 -z-10 gpu-accelerated" />
              <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-30 -z-20 animate-pulse gpu-accelerated" />
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 tracking-[0.5em] font-light"
            style={{
              textShadow:
                "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)",
            }}
          >
            LAST ATTEMPT ON SUICIDE
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 flex justify-center gap-4"
          >
            {[
              { text: "MUSIC", href: "#" },
              { text: "SHOWS", href: "#" },
              { text: "MERCH", href: "/products" },
            ].map(({ text, href }) => (
              <motion.a
                key={text}
                href={href}
                whileHover={{ scale: 1.1, y: -5 }}
                className="px-6 py-3 border border-pink-500/50 rounded-full backdrop-blur-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 cursor-pointer"
                style={{
                  boxShadow:
                    "0 0 20px rgba(236, 72, 153, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)",
                }}
              >
                <span className="text-sm font-bold tracking-wider">{text}</span>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="relative">
            <ChevronRight className="w-10 h-10 rotate-90 text-pink-500" />
            <div className="absolute inset-0 blur-xl bg-pink-500 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* Holographic Music Player */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              SONIC WAVES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 animate-pulse" />

            <motion.div
              className="bg-black/50 backdrop-blur-2xl rounded-3xl p-10 border border-purple-500/30 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                boxShadow:
                  "0 0 100px rgba(236, 72, 153, 0.3), inset 0 0 50px rgba(168, 85, 247, 0.1)",
              }}
            >
              {/* Holographic effect overlay */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
              </div>

              {/* Player Header */}
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                  <motion.h3
                    className="text-4xl font-bold text-white mb-2 flex items-center gap-3"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Music className="w-8 h-8 text-pink-500" />
                    {tracks[currentTrack].title}
                  </motion.h3>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs font-semibold text-purple-300 border border-purple-500/30">
                      {tracks[currentTrack].genre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tracks[currentTrack].duration}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 relative group"
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 relative group overflow-hidden"
                    style={{
                      boxShadow:
                        "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ opacity: isPlaying ? 1 : 0 }}
                    />
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                  </motion.button>
                </div>
              </div>

              {/* Waveform Visualizer */}
              <div className="h-24 mb-8 relative overflow-hidden rounded-xl bg-black/30 border border-purple-500/20">
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {[...Array(50)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full gpu-accelerated"
                      animate={{
                        height: isPlaying ? [10, 20 + (i % 5) * 12, 10] : 10,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.02,
                      }}
                      style={{
                        boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)",
                        transform: "translateZ(0)",
                        willChange: "height",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 10, scale: 1.02 }}
                    onClick={() => setCurrentTrack(index)}
                    className={`p-5 rounded-xl cursor-pointer transition-all relative overflow-hidden group ${
                      currentTrack === index
                        ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40"
                        : "hover:bg-gradient-to-r hover:from-gray-800/30 hover:to-gray-900/30 border border-transparent hover:border-purple-500/20"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />

                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={
                            currentTrack === index ? { rotate: 360 } : {}
                          }
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Disc3
                            className={`w-6 h-6 ${
                              currentTrack === index
                                ? "text-pink-500"
                                : "text-gray-500"
                            }`}
                          />
                        </motion.div>
                        <div>
                          <span className="font-semibold text-lg">
                            {track.title}
                          </span>
                          <span className="text-gray-400 text-sm ml-3">
                            {track.genre}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{track.duration}</span>
                        {currentTrack === index && (
                          <Radio className="w-5 h-5 text-pink-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Futuristic Shows Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500">
              LIVE EXPERIENCES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <div className="grid gap-6">
            {shows.map((show, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", damping: 20 }}
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <GPUAccelerated
                  className="relative bg-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-purple-500/30 overflow-hidden group"
                  style={{
                    background:
                      hoveredCard === index
                        ? "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)"
                        : "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
                    boxShadow:
                      hoveredCard === index
                        ? "0 0 80px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.2)"
                        : "0 0 30px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                  }}
                >
                  {/* Holographic lines */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent"
                        style={{ top: `${30 + i * 20}%` }}
                        animate={{
                          x: [-200, 200],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "linear",
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg backdrop-blur-xl border border-pink-500/30">
                          <Calendar className="w-6 h-6 text-pink-400" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                          {new Date(show.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold">{show.venue}</span>
                        </div>
                        <span className="text-purple-300">•</span>
                        <span className="text-lg">{show.city}</span>
                      </div>
                    </div>

                    {show.soldOut ? (
                      <div className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl font-bold text-gray-400 border border-gray-700">
                        SOLD OUT
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg relative overflow-hidden group"
                        style={{
                          boxShadow:
                            "0 0 40px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <span className="relative z-10">GET TICKETS</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    )}
                  </div>
                </GPUAccelerated>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Holographic Albums Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              CYBER DISCOGRAPHY
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {albums.map((album, index) => (
              <motion.div
                key={index}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, type: "spring", damping: 20 }}
                whileHover={{ y: -20, scale: 1.05 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className="relative bg-black/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/30"
                  style={{
                    boxShadow:
                      "0 0 50px rgba(236, 72, 153, 0.2), inset 0 0 30px rgba(168, 85, 247, 0.1)",
                  }}
                >
                  {/* Album Cover with Holographic Effect */}
                  <div className="relative overflow-hidden aspect-square">
                    {/* Custom Album Art */}
                    <div className="w-full h-full relative">
                      {album.theme === "rebellion" && (
                        <div className="absolute inset-0 bg-black overflow-hidden">
                          {/* Background gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-900" />

                          {/* Glitch lines */}
                          {[...Array(10)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-full h-[2px] gpu-accelerated"
                              style={{
                                top: `${i * 10 + 5}%`,
                                background:
                                  i % 2 === 0
                                    ? "rgba(239, 68, 68, 0.8)"
                                    : "rgba(168, 85, 247, 0.8)",
                                transform: "translateZ(0)",
                                willChange: "transform, opacity",
                              }}
                              animate={{
                                x: [-100, 0, 100],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "linear",
                              }}
                            />
                          ))}

                          {/* Central symbol - anarchy A */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              animate={{
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                              }}
                              className="relative"
                            >
                              <div
                                className="text-9xl font-black text-red-500 relative"
                                style={{
                                  filter:
                                    "drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))",
                                  fontFamily: "monospace",
                                }}
                              >
                                A
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                  className="w-32 h-32 rounded-full border-8 border-red-500"
                                  style={{
                                    filter:
                                      "drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))",
                                  }}
                                />
                              </div>
                            </motion.div>
                          </div>

                          {/* Digital noise overlay */}
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage:
                                'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" /%3E%3C/svg%3E")',
                            }}
                          />
                        </div>
                      )}

                      {album.theme === "dreams" && (
                        <div className="absolute inset-0 bg-black overflow-hidden">
                          {/* Dreamy gradient background */}
                          <motion.div
                            className="absolute inset-0"
                            animate={{
                              background: [
                                "radial-gradient(circle at 20% 50%, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)",
                                "radial-gradient(circle at 80% 50%, #06b6d4 0%, #ec4899 50%, #8b5cf6 100%)",
                                "radial-gradient(circle at 50% 80%, #8b5cf6 0%, #06b6d4 50%, #ec4899 100%)",
                                "radial-gradient(circle at 20% 50%, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)",
                              ],
                            }}
                            transition={{
                              duration: 10,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />

                          {/* Floating neon clouds */}
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute rounded-full"
                              style={{
                                width: `${150 + i * 30}px`,
                                height: `${80 + i * 20}px`,
                                background: `radial-gradient(ellipse, ${
                                  [
                                    "rgba(236, 72, 153, 0.3)",
                                    "rgba(139, 92, 246, 0.3)",
                                    "rgba(6, 182, 212, 0.3)",
                                  ][i % 3]
                                } 0%, transparent 70%)`,
                                filter: "blur(20px)",
                              }}
                              animate={{
                                x: ["-20%", "120%"],
                                y: [
                                  `${20 + i * 15}%`,
                                  `${30 + i * 10}%`,
                                  `${20 + i * 15}%`,
                                ],
                              }}
                              transition={{
                                duration: 15 + i * 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          ))}

                          {/* Center moon/portal */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="relative"
                            >
                              <div
                                className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400"
                                style={{
                                  filter:
                                    "drop-shadow(0 0 50px rgba(236, 72, 153, 0.8))",
                                }}
                              />
                              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 opacity-80" />
                              <div className="absolute inset-8 rounded-full bg-black opacity-50" />
                            </motion.div>
                          </div>

                          {/* Stars */}
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full"
                              style={{
                                left: `${(i * 5) % 100}%`,
                                top: `${(i * 7) % 100}%`,
                                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                              }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{
                                duration: 2 + (i % 3),
                                repeat: Infinity,
                                delay: (i % 5) * 0.4,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {album.theme === "void" && (
                        <div className="absolute inset-0 bg-black overflow-hidden">
                          {/* Deep void gradient */}
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-purple-950" />

                          {/* Digital grid */}
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage: `
                                linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)
                              `,
                              backgroundSize: "30px 30px",
                            }}
                          />

                          {/* Central void portal */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div className="relative">
                              {/* Rotating rings */}
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 rounded-full border border-purple-500/30 gpu-accelerated"
                                  style={{
                                    width: `${200 - i * 50}px`,
                                    height: `${200 - i * 50}px`,
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate3d(-50%, -50%, 0)",
                                    filter: `drop-shadow(0 0 ${
                                      10 + i * 5
                                    }px rgba(168, 85, 247, 0.5))`,
                                    willChange: "transform",
                                  }}
                                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                                  transition={{
                                    duration: 20 + i * 10,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                              ))}

                              {/* Center black hole */}
                              <motion.div
                                className="w-24 h-24 rounded-full bg-black relative"
                                style={{
                                  boxShadow:
                                    "inset 0 0 50px rgba(168, 85, 247, 0.8), 0 0 100px rgba(168, 85, 247, 0.4)",
                                }}
                                animate={{ scale: [1, 0.8, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-purple-800/20 to-transparent animate-spin-slow" />
                              </motion.div>
                            </motion.div>
                          </div>

                          {/* Binary rain */}
                          {[...Array(10)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-purple-500/30 font-mono text-xs"
                              style={{ left: `${i * 10}%` }}
                              animate={{ y: ["-20px", "100%"] }}
                              transition={{
                                duration: 5 + (i % 3) * 2,
                                repeat: Infinity,
                                delay: i % 5,
                                ease: "linear",
                              }}
                            >
                              {i % 2 === 0 ? "1" : "0"}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                    {/* Floating particles on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full gpu-accelerated"
                          initial={{
                            x: `${i * 10 + 5}%`,
                            y: "100%",
                            opacity: 0,
                          }}
                          animate={{
                            y: "-20%",
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeOut",
                          }}
                          style={{
                            transform: "translateZ(0)",
                            willChange: "transform, opacity",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="p-8">
                    <h3 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                      {album.title}
                    </h3>
                    <div className="flex items-center gap-4 mb-6 text-gray-400">
                      <span className="text-lg">{album.year}</span>
                      <span className="text-purple-300">•</span>
                      <span>{album.tracks} tracks</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-bold flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                      style={{
                        boxShadow:
                          "0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <Play size={20} />
                      <span>STREAM ON SPOTIFY</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 -z-10"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Cyberpunk Gallery */}
      <section className="py-20 px-4 md:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500">
              VISUAL ARCHIVES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.1, type: "spring", damping: 15 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="relative group perspective-1000"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 to-purple-500/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className="relative overflow-hidden rounded-2xl border border-purple-500/30"
                  style={{
                    boxShadow:
                      "0 0 40px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                    transform: "translateZ(0)",
                  }}
                >
                  <Image
                    src={photo}
                    alt={`Band photo ${index + 1}`}
                    width={600}
                    height={400}
                    className="w-full h-[400px] object-cover transition-all duration-700 group-hover:scale-110"
                    quality={90}
                    priority={index < 2}
                  />

                  {/* Cyberpunk scan lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent"
                        style={{ top: `${i * 5}%` }}
                      />
                    ))}
                  </div>

                  {/* Glitch effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    animate={{
                      x: [0, -5, 5, -5, 0],
                      opacity: [0, 1, 0, 1, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 mix-blend-screen" />
                  </motion.div>

                  {/* Number overlay */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-xl rounded-lg border border-pink-500/30">
                    <span className="text-pink-500 font-mono text-sm">
                      #{(index + 1).toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Futuristic Contact Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              CONNECT
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl animate-pulse" />

            <div
              className="relative bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border border-purple-500/30 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                boxShadow:
                  "0 0 80px rgba(236, 72, 153, 0.3), inset 0 0 40px rgba(168, 85, 247, 0.1)",
              }}
            >
              {/* Circuit board pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                <div className="absolute top-3/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
                <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-pink-500 to-transparent" />
                <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
              </div>

              <p className="text-2xl text-gray-300 mb-10 font-light tracking-wide">
                For bookings, press inquiries, and dimensional travel
              </p>

              <motion.a
                href="mailto:contact@laosband.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl font-bold text-xl relative overflow-hidden group"
                style={{
                  boxShadow:
                    "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
                }}
              >
                <Mail size={28} />
                <span className="relative z-10">contact@laosband.com</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>

              <div className="flex justify-center gap-8 mt-16">
                {[
                  { Icon: Instagram, color: "from-pink-500 to-purple-500" },
                  { Icon: Twitter, color: "from-blue-400 to-blue-600" },
                  { Icon: Youtube, color: "from-red-500 to-red-600" },
                ].map(({ Icon, color }, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${color} relative group`}
                    style={{
                      boxShadow: `0 0 30px ${
                        index === 0
                          ? "rgba(236, 72, 153, 0.5)"
                          : index === 1
                          ? "rgba(59, 130, 246, 0.5)"
                          : "rgba(239, 68, 68, 0.5)"
                      }`,
                    }}
                  >
                    <Icon size={28} />
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${color} blur-xl opacity-0 group-hover:opacity-70 transition-opacity`}
                    />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-purple-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.p
            className="text-gray-400 text-lg font-light tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            &copy; 2025 Last Attempt On Suicide. Transcending dimensions since
            2023.
          </motion.p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        /* GPU Optimization Classes */
        .gpu-accelerated {
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
        }

        /* Force GPU for heavy animations */
        .blur-xl,
        .blur-2xl,
        .blur-3xl,
        .blur-\\[50px\\],
        .blur-\\[100px\\],
        .blur-\\[150px\\],
        .blur-\\[200px\\] {
          transform: translate3d(0, 0, 0);
        }

        /* Optimize backdrop filters */
        .backdrop-blur-xl,
        .backdrop-blur-2xl {
          transform: translateZ(0);
          will-change: backdrop-filter;
        }

        /* Reduce paint areas for animated elements */
        .animate-pulse {
          will-change: opacity;
        }

        /* Optimize gradient animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LAOSLandingPage;
