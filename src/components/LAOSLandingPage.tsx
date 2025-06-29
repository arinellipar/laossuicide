"use client";

import React, {
  useState,
  useRef,
  useEffect,
  
  useMemo,
} from "react";
import {
  motion,
  
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  
} from "framer-motion";
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
} from "lucide-react";

// GPU-accelerated particle system using Canvas
const GPUParticleSystem = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;
      size: number;
    }>
  >([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    });
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Initialize particles
    const particleCount = 50;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.5 + 0.3,
      size: Math.random() * 2 + 1,
    }));

    // Animation loop using requestAnimationFrame
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient for particles
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0, "rgba(236, 72, 153, 0.8)");
      gradient.addColorStop(1, "rgba(168, 85, 247, 0.4)");

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;

        // Draw particle with glow effect
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(236, 72, 153, 0.8)";

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    />
  );
});

GPUParticleSystem.displayName = "GPUParticleSystem";

// Optimized glow orb component
const OptimizedGlowOrb = React.memo(() => {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] gpu-accelerated"
      style={{
        transform: "translate(-50%, -50%) translateZ(0)",
        willChange: "transform",
      }}
      animate={{
        rotate: [0, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
          filter: "blur(100px)",
          transform: "translateZ(0)",
          willChange: "filter",
        }}
      />
      <div
        className="absolute inset-20 rounded-full animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
          filter: "blur(80px)",
          transform: "translateZ(0)",
          willChange: "filter",
        }}
      />
    </motion.div>
  );
});

OptimizedGlowOrb.displayName = "OptimizedGlowOrb";

// GPU-optimized animated line component
const AnimatedLine = React.memo(({ index }: { index: number }) => {
  return (
    <motion.div
      className="absolute h-[1px] w-full gpu-accelerated"
      style={{
        top: `${20 + index * 15}%`,
        background:
          "linear-gradient(90deg, transparent 0%, #ec4899 50%, transparent 100%)",
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
        delay: index * 0.5,
        ease: "linear",
      }}
    />
  );
});

AnimatedLine.displayName = "AnimatedLine";

// Optimized waveform visualizer using Canvas
const WaveformVisualizer = React.memo(
  ({ isPlaying }: { isPlaying: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barsRef = useRef<number[]>(Array(50).fill(10));
    const animationIdRef = useRef<number | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      if (!ctx) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const barCount = 50;
      const barWidth = canvas.offsetWidth / barCount - 2;
      const maxHeight = canvas.offsetHeight * 0.8;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.offsetHeight, 0, 0);
        gradient.addColorStop(0, "#ec4899");
        gradient.addColorStop(1, "#a855f7");

        barsRef.current.forEach((height, i) => {
          // Update height
          if (isPlaying) {
            const targetHeight = 10 + Math.random() * maxHeight;
            barsRef.current[i] += (targetHeight - height) * 0.1;
          } else {
            barsRef.current[i] += (10 - height) * 0.1;
          }

          // Draw bar
          const x = i * (barWidth + 2) + 1;
          const y = canvas.offsetHeight - barsRef.current[i];

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barsRef.current[i]);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(236, 72, 153, 0.5)";
        });

        animationIdRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      };
    }, [isPlaying]);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          transform: "translateZ(0)",
          willChange: "contents",
        }}
      />
    );
  }
);

WaveformVisualizer.displayName = "WaveformVisualizer";

const LAOSLandingPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Optimized transforms with spring physics
  const parallaxY = useSpring(useTransform(scrollY, [0, 500], [0, -150]), {
    stiffness: 100,
    damping: 30,
  });
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.5]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced mouse move handler
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          mouseX.set(e.clientX);
          mouseY.set(e.clientY);
          ticking = false;
        });
        ticking = true;
      }
    };

    if (mounted) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [mouseX, mouseY, mounted]);

  // Memoized data
  const tracks = useMemo(
    () => [
      {
        title: "Broken Mirrors",
        duration: "3:45",
        url: "#",
        genre: "Synthwave",
      },
      { title: "Neon Shadows", duration: "4:12", url: "#", genre: "Darkwave" },
      { title: "Last Breath", duration: "3:58", url: "#", genre: "Cyberpunk" },
    ],
    []
  );

  const shows = useMemo(
    () => [
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
    ],
    []
  );

  const albums = useMemo(
    () => [
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
    ],
    []
  );

  const photos = useMemo(
    () => [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
    ],
    []
  );

  // GPU-optimized grid background
  const GlowingGrid = React.memo(() => {
    return (
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none gpu-accelerated"
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
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
  });

  GlowingGrid.displayName = "GlowingGrid";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <GPUParticleSystem />

      {/* Futuristic Hero Section with GPU optimizations */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <GlowingGrid />

        <motion.div
          style={{
            y: parallaxY,
            scale,
            transform: "translateZ(0)",
            willChange: "transform",
          }}
          className="absolute inset-0 z-0 gpu-accelerated"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black" />

          <OptimizedGlowOrb />

          {/* GPU-optimized animated lines */}
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <AnimatedLine key={i} index={i} />
            ))}
          </div>
        </motion.div>

        <motion.div
          style={{
            opacity,
            transform: "translateZ(0)",
            willChange: "opacity",
          }}
          className="relative z-10 text-center px-4 gpu-accelerated"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, type: "spring", damping: 15 }}
            className="relative inline-block mb-8"
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            {/* Lightning bolts with GPU acceleration */}
            <motion.div
              className="absolute top-1/2 -left-16 md:-left-24 -translate-y-1/2 gpu-accelerated"
              style={{
                transform: "translateY(-50%) translateZ(0)",
                willChange: "transform, filter",
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                filter: [
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                  "brightness(1) blur(0px)",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,1)]" />
            </motion.div>

            <motion.div
              className="absolute top-1/2 -right-16 md:-right-24 -translate-y-1/2 gpu-accelerated"
              style={{
                transform: "translateY(-50%) translateZ(0)",
                willChange: "transform, filter",
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                filter: [
                  "brightness(1) blur(0px)",
                  "brightness(2) blur(1px)",
                  "brightness(1) blur(0px)",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 2,
                delay: 0.4,
              }}
            >
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,1)]" />
            </motion.div>

            <h1
              className="text-8xl md:text-[12rem] font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 relative gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              LAOS
              <div
                className="absolute inset-0 blur-[50px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-50 -z-10 gpu-accelerated"
                style={{
                  transform: "translateZ(0)",
                  willChange: "filter",
                }}
              />
              <div
                className="absolute inset-0 blur-[100px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-30 -z-20 animate-pulse gpu-accelerated"
                style={{
                  transform: "translateZ(0)",
                  willChange: "filter, opacity",
                }}
              />
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 tracking-[0.5em] font-light gpu-accelerated"
            style={{
              textShadow:
                "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)",
              transform: "translateZ(0)",
              willChange: "transform",
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
            {["MUSIC", "SHOWS", "MERCH"].map((text) => (
              <motion.div
                key={text}
                whileHover={{ scale: 1.1, y: -5 }}
                className="px-6 py-3 border border-pink-500/50 rounded-full backdrop-blur-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 cursor-pointer gpu-accelerated"
                style={{
                  boxShadow:
                    "0 0 20px rgba(236, 72, 153, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)",
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
              >
                <span className="text-sm font-bold tracking-wider">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 gpu-accelerated"
          style={{
            transform: "translateX(-50%) translateZ(0)",
            willChange: "transform",
          }}
        >
          <div className="relative">
            <ChevronRight className="w-10 h-10 rotate-90 text-pink-500" />
            <div className="absolute inset-0 blur-xl bg-pink-500 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* Holographic Music Player with GPU optimizations */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              SONIC WAVES
            </span>
            <div
              className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />
          </motion.h2>

          <div className="relative">
            <div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />

            <motion.div
              className="bg-black/50 backdrop-blur-2xl rounded-3xl p-10 border border-purple-500/30 relative overflow-hidden gpu-accelerated"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                boxShadow:
                  "0 0 100px rgba(236, 72, 153, 0.3), inset 0 0 50px rgba(168, 85, 247, 0.1)",
                transform: "translateZ(0)",
                willChange: "transform",
                contain: "layout style paint",
              }}
            >
              {/* Holographic effect overlay */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer gpu-accelerated"
                  style={{
                    transform: "translateZ(0) skewX(-12deg)",
                    willChange: "transform",
                  }}
                />
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
                    className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 relative group gpu-accelerated"
                    style={{
                      transform: "translateZ(0)",
                      willChange: "transform",
                    }}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity gpu-accelerated"
                      style={{
                        transform: "translateZ(0)",
                        willChange: "opacity, filter",
                      }}
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 relative group overflow-hidden gpu-accelerated"
                    style={{
                      boxShadow:
                        "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
                      transform: "translateZ(0)",
                      willChange: "transform",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30 gpu-accelerated"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        opacity: isPlaying ? 1 : 0,
                        transform: "translateZ(0)",
                        willChange: "transform, opacity",
                      }}
                    />
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                  </motion.button>
                </div>
              </div>

              {/* GPU-optimized Waveform Visualizer */}
              <div className="h-24 mb-8 relative overflow-hidden rounded-xl bg-black/30 border border-purple-500/20">
                <WaveformVisualizer isPlaying={isPlaying} />
              </div>

              {/* Track List */}
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 10, scale: 1.02 }}
                    onClick={() => setCurrentTrack(index)}
                    className={`p-5 rounded-xl cursor-pointer transition-all relative overflow-hidden group gpu-accelerated ${
                      currentTrack === index
                        ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40"
                        : "hover:bg-gradient-to-r hover:from-gray-800/30 hover:to-gray-900/30 border border-transparent hover:border-purple-500/20"
                    }`}
                    style={{
                      transform: "translateZ(0)",
                      willChange: "transform",
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 gpu-accelerated"
                      style={{
                        transform: "translateZ(0)",
                        willChange: "transform",
                      }}
                    />

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
                          style={{
                            transform: "translateZ(0)",
                            willChange: "transform",
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

      {/* GPU-optimized Shows Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent gpu-accelerated"
          style={{
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative z-10"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              LIVE EXPERIENCES
            </span>
            <div
              className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />
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
                className="relative gpu-accelerated"
                style={{
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity gpu-accelerated"
                  style={{
                    transform: "translateZ(0)",
                    willChange: "opacity, filter",
                  }}
                />

                <div
                  className="relative bg-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-purple-500/30 overflow-hidden group gpu-accelerated"
                  style={{
                    background:
                      hoveredCard === index
                        ? "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)"
                        : "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
                    boxShadow:
                      hoveredCard === index
                        ? "0 0 80px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.2)"
                        : "0 0 30px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                    transform: "translateZ(0)",
                    willChange: "transform",
                    contain: "layout style paint",
                  }}
                >
                  {/* Holographic lines with GPU optimization */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-[1px] w-full gpu-accelerated"
                        style={{
                          top: `${30 + i * 20}%`,
                          background:
                            "linear-gradient(90deg, transparent 0%, #ec4899 50%, transparent 100%)",
                          transform: "translateZ(0)",
                          willChange: "transform, opacity",
                        }}
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
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg relative overflow-hidden group gpu-accelerated"
                        style={{
                          boxShadow:
                            "0 0 40px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                          transform: "translateZ(0)",
                          willChange: "transform",
                        }}
                      >
                        <span className="relative z-10">GET TICKETS</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 gpu-accelerated"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            transform: "translateZ(0)",
                            willChange: "transform",
                          }}
                        />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* GPU-optimized Albums Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              CYBER DISCOGRAPHY
            </span>
            <div
              className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {albums.map((album, index) => (
              <motion.div
                key={index}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, type: "spring", damping: 20 }}
                whileHover={{ y: -20, scale: 1.05 }}
                className="group relative gpu-accelerated"
                style={{
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div
                  className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 gpu-accelerated"
                  style={{
                    transform: "translateZ(0)",
                    willChange: "opacity, filter",
                  }}
                />

                <div
                  className="relative bg-black/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/30 gpu-accelerated"
                  style={{
                    boxShadow:
                      "0 0 50px rgba(236, 72, 153, 0.2), inset 0 0 30px rgba(168, 85, 247, 0.1)",
                    transform: "translateZ(0)",
                    willChange: "transform",
                    contain: "layout style paint",
                  }}
                >
                  {/* Album Cover with GPU-optimized Holographic Effect */}
                  <div className="relative overflow-hidden aspect-square">
                    {/* GPU-optimized Album Art */}
                    <div
                      className="w-full h-full relative gpu-accelerated"
                      style={{
                        transform: "translateZ(0)",
                        willChange: "transform",
                      }}
                    >
                      {album.theme === "rebellion" && (
                        <div className="absolute inset-0 bg-black overflow-hidden">
                          {/* Background gradient */}
                          <div
                            className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-900 gpu-accelerated"
                            style={{
                              transform: "translateZ(0)",
                              willChange: "transform",
                            }}
                          />

                          {/* GPU-optimized glitch lines */}
                          <div className="absolute inset-0">
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
                          </div>

                          {/* Central symbol with GPU optimization */}
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
                              className="relative gpu-accelerated"
                              style={{
                                transform: "translateZ(0)",
                                willChange: "transform",
                              }}
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
                            className="absolute inset-0 opacity-20 mix-blend-overlay"
                            style={{
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
                            }}
                          />
                        </div>
                      )}

                      {album.theme === "dreams" && (
                        <div className="absolute inset-0 bg-black overflow-hidden">
                          {/* GPU-optimized dreamy gradient background */}
                          <motion.div
                            className="absolute inset-0 gpu-accelerated"
                            style={{
                              transform: "translateZ(0)",
                              willChange: "background",
                            }}
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

                          {/* GPU-optimized floating neon clouds */}
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute rounded-full gpu-accelerated"
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
                                transform: "translateZ(0)",
                                willChange: "transform",
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

                          {/* Center moon/portal with GPU optimization */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="relative gpu-accelerated"
                              style={{
                                transform: "translateZ(0)",
                                willChange: "transform",
                              }}
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

                          {/* GPU-optimized stars */}
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full gpu-accelerated"
                              style={{
                                left: `${(i * 5) % 100}%`,
                                top: `${(i * 7) % 100}%`,
                                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                                transform: "translateZ(0)",
                                willChange: "opacity",
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
                          <div
                            className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-purple-950 gpu-accelerated"
                            style={{
                              transform: "translateZ(0)",
                              willChange: "transform",
                            }}
                          />

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

                          {/* Central void portal with GPU optimization */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div className="relative">
                              {/* GPU-optimized rotating rings */}
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 rounded-full border border-purple-500/30 gpu-accelerated"
                                  style={{
                                    width: `${200 - i * 50}px`,
                                    height: `${200 - i * 50}px`,
                                    left: "50%",
                                    top: "50%",
                                    transform:
                                      "translate(-50%, -50%) translateZ(0)",
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

                              {/* Center black hole with GPU optimization */}
                              <motion.div
                                className="w-24 h-24 rounded-full bg-black relative gpu-accelerated"
                                style={{
                                  boxShadow:
                                    "inset 0 0 50px rgba(168, 85, 247, 0.8), 0 0 100px rgba(168, 85, 247, 0.4)",
                                  transform: "translateZ(0)",
                                  willChange: "transform",
                                }}
                                animate={{ scale: [1, 0.8, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-purple-800/20 to-transparent animate-spin-slow" />
                              </motion.div>
                            </motion.div>
                          </div>

                          {/* Binary rain with GPU optimization */}
                          {[...Array(10)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-purple-500/30 font-mono text-xs gpu-accelerated"
                              style={{
                                left: `${i * 10}%`,
                                transform: "translateZ(0)",
                                willChange: "transform",
                              }}
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

                    {/* GPU-optimized floating particles on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full gpu-accelerated"
                          style={{
                            transform: "translateZ(0)",
                            willChange: "transform, opacity",
                          }}
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
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-bold flex items-center justify-center gap-3 relative overflow-hidden group/btn gpu-accelerated"
                      style={{
                        boxShadow:
                          "0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                        transform: "translateZ(0)",
                        willChange: "transform",
                      }}
                    >
                      <Play size={20} />
                      <span>STREAM ON SPOTIFY</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 -z-10 gpu-accelerated"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          transform: "translateZ(0)",
                          willChange: "transform",
                        }}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* GPU-optimized Gallery */}
      <section className="py-20 px-4 md:px-8 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent gpu-accelerated"
          style={{
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative z-10"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              VISUAL ARCHIVES
            </span>
            <div
              className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.1, type: "spring", damping: 15 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="relative group perspective-1000 gpu-accelerated"
                style={{
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div
                  className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 to-purple-500/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 gpu-accelerated"
                  style={{
                    transform: "translateZ(0)",
                    willChange: "opacity, filter",
                  }}
                />

                <div
                  className="relative overflow-hidden rounded-2xl border border-purple-500/30 gpu-accelerated"
                  style={{
                    boxShadow:
                      "0 0 40px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                    transform: "translateZ(0)",
                    willChange: "transform",
                    contain: "layout style paint",
                  }}
                >
                  <img
                    src={photo}
                    alt={`Band photo ${index + 1}`}
                    className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110 gpu-accelerated"
                    style={{
                      transform: "translateZ(0) scale(1)",
                      willChange: "transform",
                    }}
                    loading="lazy"
                  />

                  {/* GPU-optimized scan lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent"
                        style={{ top: `${i * 5}%` }}
                      />
                    ))}
                  </div>

                  {/* GPU-optimized glitch effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 gpu-accelerated"
                    style={{
                      transform: "translateZ(0)",
                      willChange: "transform, opacity",
                    }}
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

      {/* GPU-optimized Contact Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative z-10"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-16 relative"
            whileInView={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              CONNECT
            </span>
            <div
              className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />
          </motion.h2>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative gpu-accelerated"
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            <div
              className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl animate-pulse gpu-accelerated"
              style={{
                transform: "translateZ(0)",
                willChange: "filter, opacity",
              }}
            />

            <div
              className="relative bg-black/50 backdrop-blur-2xl rounded-3xl p-12 border border-purple-500/30 overflow-hidden gpu-accelerated"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                boxShadow:
                  "0 0 80px rgba(236, 72, 153, 0.3), inset 0 0 40px rgba(168, 85, 247, 0.1)",
                transform: "translateZ(0)",
                willChange: "transform",
                contain: "layout style paint",
              }}
            >
              {/* Circuit board pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
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
                className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl font-bold text-xl relative overflow-hidden group gpu-accelerated"
                style={{
                  boxShadow:
                    "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
              >
                <Mail size={28} />
                <span className="relative z-10">contact@laosband.com</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 gpu-accelerated"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: "translateZ(0)",
                    willChange: "transform",
                  }}
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
                    className={`p-4 rounded-2xl bg-gradient-to-r ${color} relative group gpu-accelerated`}
                    style={{
                      boxShadow: `0 0 30px ${
                        index === 0
                          ? "rgba(236, 72, 153, 0.5)"
                          : index === 1
                          ? "rgba(59, 130, 246, 0.5)"
                          : "rgba(239, 68, 68, 0.5)"
                      }`,
                      transform: "translateZ(0)",
                      willChange: "transform",
                    }}
                  >
                    <Icon size={28} />
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${color} blur-xl opacity-0 group-hover:opacity-70 transition-opacity gpu-accelerated`}
                      style={{
                        transform: "translateZ(0)",
                        willChange: "opacity, filter",
                      }}
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
        <div
          className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent gpu-accelerated"
          style={{
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        />

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

        .gpu-accelerated {
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default LAOSLandingPage;
