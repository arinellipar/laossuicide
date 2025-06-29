// src/components/LAOSLandingPage.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  Variants,
} from "framer-motion";
import {
  ChevronRight,
  Calendar,
  MapPin,
  Mail,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Zap,
  Ticket,
  Heart,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Menu,
  ArrowUp,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

// Lazy load componentes pesados
const AudioPlayer = lazy(() => import("@/components/audio/AudioPlayer"));

/**
 * Interfaces TypeScript para type safety completo
 * Seguem padrão de imutabilidade para otimização com React.memo
 */
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileUrl: string;
  genre?: string;
  album?: string;
  waveformData?: number[];
  playCount?: number;
}

interface Show {
  id: string;
  date: string;
  venue: string;
  city: string;
  state?: string;
  country: string;
  ticketUrl: string;
  soldOut: boolean;
  featured?: boolean;
  capacity?: number;
  ticketsSold?: number;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface Album {
  id: string;
  title: string;
  year: number;
  tracks: number;
  coverUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  theme: "rebellion" | "dreams" | "void" | "neon";
  featured?: boolean;
}

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  photographer?: string;
  date?: string;
  location?: string;
  tags?: string[];
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
  tiktok?: string;
  facebook?: string;
}

interface ContactInfo {
  email: string;
  bookingEmail?: string;
  pressEmail?: string;
  phone?: string;
  address?: string;
}

/**
 * Configurações globais do componente
 * Centralizadas para fácil manutenção e customização
 */
const CONFIG = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 30000,
    retries: 3,
  },
  animation: {
    duration: 0.6,
    easing: [0.43, 0.13, 0.23, 0.96],
    stagger: 0.1,
  },
  theme: {
    primary: "#ec4899", // pink-500
    secondary: "#a855f7", // purple-500
    accent: "#06b6d4", // cyan-500
    dark: "#000000",
    light: "#ffffff",
  },
  social: {
    instagram: "https://instagram.com/laosband",
    twitter: "https://twitter.com/laosband",
    youtube: "https://youtube.com/laosband",
    spotify: "https://open.spotify.com/artist/laosband",
    appleMusic: "https://music.apple.com/artist/laosband",
    tiktok: "https://tiktok.com/@laosband",
  } as SocialLinks,
  contact: {
    email: "contact@laosband.com",
    bookingEmail: "booking@laosband.com",
    pressEmail: "press@laosband.com",
  } as ContactInfo,
};

/**
 * Custom hooks para lógica reutilizável
 * Implementam padrões de composição e separation of concerns
 */

/**
 * Hook para detecção de viewport e responsividade
 * Otimizado com debounce para performance
 */
function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    handleResize();

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
}

/**
 * Hook para controle de scroll com performance otimizada
 * Implementa throttling e passive listeners
 */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;

      setProgress(Math.min(100, Math.max(0, progress)));
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        if (scrollTimeoutRef.current !== null) {
          if (scrollTimeoutRef.current !== null) {
            clearTimeout(scrollTimeoutRef.current!);
          }
        }
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { progress, isScrolling };
}

/**
 * Componentes de UI reutilizáveis
 * Implementam composição e encapsulamento
 */

/**
 * Componente de partículas flutuantes otimizado
 * Usa CSS transforms para melhor performance
 */
const FloatingParticles = React.memo(() => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-pink-500"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            filter: "blur(1px)",
            boxShadow: `0 0 ${particle.size * 3}px rgba(236, 72, 153, 0.8)`,
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, Math.sin(particle.id) * 50],
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
});

FloatingParticles.displayName = "FloatingParticles";

/**
 * Grid cyberpunk com animação de perspectiva
 * Implementa transformações 3D para efeito de profundidade
 */
const CyberpunkGrid = React.memo(() => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacity = useTransform(scrollY, [0, 500], [0.3, 0]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          y,
          backgroundImage: `
            linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "center center",
        }}
      />
    </motion.div>
  );
});

CyberpunkGrid.displayName = "CyberpunkGrid";

/**
 * Componente de loading com animação fluida
 * Usa Framer Motion para transições suaves
 */
const LoadingSpinner = ({ size = 40, color = "#ec4899" }) => (
  <motion.div
    className="relative"
    style={{ width: size, height: size }}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    <svg viewBox="0 0 50 50" className="w-full h-full">
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          filter: `drop-shadow(0 0 10px ${color})`,
        }}
      />
    </svg>
  </motion.div>
);

/**
 * Componente de erro com retry
 * Implementa padrão de error boundary local
 */
const ErrorDisplay = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <p className="text-gray-300 mb-4">{message}</p>
    {onRetry && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-medium"
      >
        Tentar Novamente
      </motion.button>
    )}
  </motion.div>
);

/**
 * Componente principal LAOSLandingPage
 * Implementa arquitetura de componentes com lazy loading e code splitting
 */
export default function LAOSLandingPage() {
  // Estado global do componente
  const [mounted, setMounted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("hero");

  // Refs para seções
  const heroRef = useRef<HTMLElement>(null);
  const musicRef = useRef<HTMLElement>(null);
  const showsRef = useRef<HTMLElement>(null);
  const albumsRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  // Custom hooks
  const viewport = useViewport();
  const { progress: scrollProgress } = useScrollProgress();
  const { scrollY } = useScroll();

  // Motion values para animações complexas
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax transforms
  const heroParallaxY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.5]);

  // Inicialização e cleanup
  useEffect(() => {
    setMounted(true);

    // Preload de fontes
    if ("fonts" in document) {
      const fonts = document.fonts as FontFaceSet;
      Promise.all([
        fonts.load('700 48px "Space Grotesk"'),
        fonts.load('400 16px "Space Mono"'),
      ]).catch(console.error);
    }

    return () => {
      // Cleanup de recursos
    };
  }, []);

  // Mouse tracking para efeitos interativos
  useEffect(() => {
    if (!mounted || viewport.isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mounted, viewport.isMobile, mouseX, mouseY]);

  // Detecção de seção atual baseada em scroll
  useEffect(() => {
    const sections = [
      { ref: heroRef, id: "hero" },
      { ref: musicRef, id: "music" },
      { ref: showsRef, id: "shows" },
      { ref: albumsRef, id: "albums" },
      { ref: galleryRef, id: "gallery" },
      { ref: contactRef, id: "contact" },
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const section of sections) {
        if (section.ref.current) {
          const { offsetTop, offsetHeight } = section.ref.current;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setCurrentSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Queries de dados usando React Query
   * Implementam cache, retry e invalidação automática
   */

  // Query para tracks em destaque
  const {
    data: featuredTracks,
    isLoading: isLoadingTracks,
    error: tracksError,
    refetch: refetchTracks,
  } = useQuery<Track[]>({
    queryKey: ["tracks", "featured"],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.api.baseUrl}/tracks?featured=true&limit=3`
      );
      if (!response.ok) throw new Error("Failed to fetch tracks");
      const data = await response.json();
      return data.tracks || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: CONFIG.api.retries,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query para shows
  const {
    data: upcomingShows,
    isLoading: isLoadingShows,
    error: showsError,
    refetch: refetchShows,
  } = useQuery<Show[]>({
    queryKey: ["shows", "upcoming"],
    queryFn: async () => {
      const response = await fetch(`${CONFIG.api.baseUrl}/shows?upcoming=true`);
      if (!response.ok) throw new Error("Failed to fetch shows");
      const data = await response.json();
      return data.shows || [];
    },
    staleTime: 60 * 1000, // 1 minuto (shows podem esgotar rápido)
  });

  // Query para álbuns
  const {
    data: albums,
    isLoading: isLoadingAlbums,
    error: albumsError,
    refetch: refetchAlbums,
  } = useQuery<Album[]>({
    queryKey: ["albums"],
    queryFn: async () => {
      const response = await fetch(`${CONFIG.api.baseUrl}/albums`);
      if (!response.ok) throw new Error("Failed to fetch albums");
      const data = await response.json();
      return data.albums || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  // Query para fotos da galeria
  const {
    data: galleryPhotos,
    isLoading: isLoadingGallery,
    error: galleryError,
    refetch: refetchGallery,
  } = useQuery<GalleryPhoto[]>({
    queryKey: ["gallery", "featured"],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.api.baseUrl}/gallery?featured=true&limit=6`
      );
      if (!response.ok) throw new Error("Failed to fetch gallery");
      const data = await response.json();
      return data.photos || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  // Mutation para newsletter
  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(
        `${CONFIG.api.baseUrl}/newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to subscribe");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!", {
        icon: <CheckCircle className="w-5 h-5" />,
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #ec4899",
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao realizar inscrição", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #ef4444",
        },
      });
    },
  });

  /**
   * Handlers de eventos otimizados com useCallback
   */
  const handleNavClick = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setNavOpen(false);
    }
  }, []);

  const handleNewsletterSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      if (email) {
        newsletterMutation.mutate(email);
        e.currentTarget.reset();
      }
    },
    [newsletterMutation]
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Dados mockados para desenvolvimento
   * Em produção, viriam das queries
   */
  const mockTracks: Track[] = featuredTracks || [
    {
      id: "1",
      title: "Broken Mirrors",
      artist: "LAOS",
      duration: 225,
      fileUrl: "#",
      genre: "Synthwave",
    },
    {
      id: "2",
      title: "Neon Shadows",
      artist: "LAOS",
      duration: 252,
      fileUrl: "#",
      genre: "Darkwave",
    },
    {
      id: "3",
      title: "Last Breath",
      artist: "LAOS",
      duration: 238,
      fileUrl: "#",
      genre: "Cyberpunk",
    },
  ];

  const mockShows: Show[] = upcomingShows || [
    {
      id: "1",
      date: "2025-07-15",
      venue: "The Vortex Club",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
      ticketUrl: "#",
      soldOut: false,
      capacity: 1000,
      ticketsSold: 750,
      price: { min: 80, max: 150, currency: "BRL" },
    },
    {
      id: "2",
      date: "2025-07-22",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brasil",
      ticketUrl: "#",
      soldOut: false,
      capacity: 1500,
      ticketsSold: 1200,
    },
    {
      id: "3",
      date: "2025-08-05",
      venue: "Dark Matter",
      city: "Belo Horizonte",
      state: "MG",
      country: "Brasil",
      ticketUrl: "#",
      soldOut: true,
      capacity: 800,
      ticketsSold: 800,
    },
  ];

  const mockAlbums: Album[] = albums || [
    {
      id: "1",
      title: "Cyber Rebellion",
      year: 2024,
      tracks: 12,
      theme: "rebellion",
      spotifyUrl: "#",
      featured: true,
    },
    {
      id: "2",
      title: "Neon Dreams",
      year: 2023,
      tracks: 10,
      theme: "dreams",
      spotifyUrl: "#",
    },
    {
      id: "3",
      title: "Digital Void",
      year: 2022,
      tracks: 14,
      theme: "void",
      spotifyUrl: "#",
    },
  ];

  const mockPhotos: GalleryPhoto[] = galleryPhotos || [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=800&fit=crop",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop",
      caption: "Live at The Vortex Club",
      photographer: "João Silva",
      date: "2024-12-15",
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&h=800&fit=crop",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=400&fit=crop",
      caption: "Neon Dreams Tour",
      photographer: "Maria Santos",
      date: "2024-11-20",
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=800&fit=crop",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop",
      caption: "Behind the Scenes",
      photographer: "Pedro Costa",
      date: "2024-10-10",
    },
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
      caption: "Festival Performance",
      photographer: "Ana Oliveira",
      date: "2024-09-05",
    },
  ];

  /**
   * Variantes de animação reutilizáveis
   * Implementam padrões consistentes de motion design
   */
  const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  };

  const staggerContainer: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: CONFIG.animation.stagger,
      },
    },
  };

  const scaleIn: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  };

  // Renderização condicional para SSR
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* Background effects */}
      <div className="fixed inset-0 bg-black -z-50" />
      <FloatingParticles />

      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrollProgress > 5
            ? "bg-black/90 backdrop-blur-xl border-b border-purple-500/20"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <Zap className="w-8 h-8 text-pink-500" />
              <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                LAOS
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { id: "music", label: "Música" },
                { id: "shows", label: "Shows" },
                { id: "albums", label: "Álbuns" },
                { id: "gallery", label: "Galeria" },
                { id: "contact", label: "Contato" },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "text-sm font-medium transition-colors relative",
                    currentSection === item.id
                      ? "text-pink-500"
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  {item.label}
                  {currentSection === item.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="md:hidden p-2 text-white"
            >
              {navOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {navOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-b border-purple-500/20"
            >
              <div className="px-4 py-4 space-y-2">
                {[
                  { id: "music", label: "Música" },
                  { id: "shows", label: "Shows" },
                  { id: "albums", label: "Álbuns" },
                  { id: "gallery", label: "Galeria" },
                  { id: "contact", label: "Contato" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 z-[60] origin-left"
        style={{ scaleX: scrollProgress / 100 }}
      />

      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <CyberpunkGrid />

        {/* Animated Background Orbs */}
        <motion.div
          style={{ y: heroParallaxY, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black" />

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-[200px]" />
            <div className="absolute inset-20 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute inset-40 bg-gradient-to-r from-pink-500/50 to-purple-500/50 rounded-full blur-[100px] animate-pulse delay-500" />
          </motion.div>

          {/* Cyberpunk scan lines */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent"
              style={{ top: `${20 + i * 15}%` }}
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

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, type: "spring", damping: 15 }}
            className="relative inline-block mb-8"
          >
            {/* Lightning effects */}
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
              className="absolute top-1/2 -left-16 md:-left-24 -translate-y-1/2"
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
              className="absolute top-1/2 -right-16 md:-right-24 -translate-y-1/2"
            >
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,1)]" />
            </motion.div>

            {/* Main Title */}
            <h1 className="text-7xl sm:text-8xl md:text-[12rem] font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 relative select-none">
              LAOS
              <div className="absolute inset-0 blur-[50px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-50 -z-10" />
              <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-30 -z-20 animate-pulse" />
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-lg sm:text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 tracking-[0.2em] md:tracking-[0.5em] font-light uppercase"
            style={{
              textShadow:
                "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)",
            }}
          >
            Last Attempt On Suicide
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
          >
            {["MÚSICA", "SHOWS", "MERCH"].map((text, i) => (
              <motion.button
                key={text}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavClick(text.toLowerCase())}
                className="px-8 py-4 border border-pink-500/50 rounded-full backdrop-blur-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 cursor-pointer group relative overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 20px rgba(236, 72, 153, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)",
                }}
              >
                <span className="relative z-10 text-sm font-bold tracking-wider">
                  {text}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
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

      {/* Music Section */}
      <section
        ref={musicRef}
        id="music"
        className="py-20 px-4 md:px-8 relative"
      >
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              SONIC WAVES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          {/* Audio Player */}
          <motion.div variants={fadeInUp}>
            {isLoadingTracks ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size={60} />
              </div>
            ) : tracksError ? (
              <ErrorDisplay
                message="Erro ao carregar músicas"
                onRetry={refetchTracks}
              />
            ) : mockTracks.length > 0 ? (
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size={60} />
                  </div>
                }
              >
                <AudioPlayer
                  tracks={mockTracks}
                  showWaveform={!viewport.isMobile}
                  theme="cyberpunk"
                  onTrackChange={(track) => {
                    console.log("Now playing:", track.title);
                  }}
                  onLike={(track, liked) => {
                    toast.success(
                      liked
                        ? `${track.title} adicionada aos favoritos`
                        : `${track.title} removida dos favoritos`,
                      {
                        icon: (
                          <Heart
                            className="w-5 h-5"
                            fill={liked ? "currentColor" : "none"}
                          />
                        ),
                      }
                    );
                  }}
                />
              </Suspense>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma música disponível no momento</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Shows Section */}
      <section
        ref={showsRef}
        id="shows"
        className="py-20 px-4 md:px-8 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500">
              LIVE EXPERIENCES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse" />
          </motion.h2>

          {isLoadingShows ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size={60} />
            </div>
          ) : showsError ? (
            <ErrorDisplay
              message="Erro ao carregar shows"
              onRetry={refetchShows}
            />
          ) : (
            <div className="grid gap-6">
              {mockShows.map((show, index) => (
                <motion.div
                  key={show.id}
                  variants={fadeInUp}
                  custom={index}
                  whileHover={{ scale: 1.02 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div
                    className="relative bg-black/40 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-purple-500/30 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
                      boxShadow:
                        "0 0 30px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                    }}
                  >
                    {/* Holographic lines */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
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
                          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                            {format(
                              parseISO(show.date),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-gray-300">
                            <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <span className="font-semibold text-lg">
                              {show.venue}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-400">
                            <span className="ml-8">
                              {show.city}
                              {show.state ? `, ${show.state}` : ""} -{" "}
                              {show.country}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar for tickets */}
                        {show.capacity &&
                          show.ticketsSold !== undefined &&
                          !show.soldOut && (
                            <div className="mt-4">
                              <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>{show.ticketsSold} vendidos</span>
                                <span>{show.capacity} total</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${
                                      (show.ticketsSold / show.capacity) * 100
                                    }%`,
                                  }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                  style={{
                                    boxShadow:
                                      "0 0 10px rgba(236, 72, 153, 0.5)",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        {show.price && !show.soldOut && (
                          <div className="text-right">
                            <p className="text-sm text-gray-400">A partir de</p>
                            <p className="text-2xl font-bold text-pink-400">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: show.price.currency,
                              }).format(show.price.min)}
                            </p>
                          </div>
                        )}

                        {show.soldOut ? (
                          <div className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl font-bold text-gray-400 border border-gray-700">
                            ESGOTADO
                          </div>
                        ) : (
                          <motion.a
                            href={show.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg relative overflow-hidden group inline-flex items-center gap-2"
                            style={{
                              boxShadow:
                                "0 0 40px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            <Ticket className="w-5 h-5" />
                            <span className="relative z-10">INGRESSOS</span>
                            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: 0 }}
                              transition={{ duration: 0.3 }}
                            />
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Albums Section */}
      <section
        ref={albumsRef}
        id="albums"
        className="py-20 px-4 md:px-8 relative"
      >
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              CYBER DISCOGRAPHY
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          {isLoadingAlbums ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size={60} />
            </div>
          ) : albumsError ? (
            <ErrorDisplay
              message="Erro ao carregar álbuns"
              onRetry={refetchAlbums}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {mockAlbums.map((album, index) => (
                <motion.div
                  key={album.id}
                  variants={scaleIn}
                  custom={index}
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
                    {/* Album Cover */}
                    <div className="relative overflow-hidden aspect-square">
                      <AlbumArtwork theme={album.theme} />

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                      {/* Featured badge */}
                      {album.featured && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.5 }}
                          className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold"
                        >
                          DESTAQUE
                        </motion.div>
                      )}

                      {/* Floating particles on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {[...Array(10)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
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
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                        {album.title}
                      </h3>
                      <div className="flex items-center gap-4 mb-6 text-gray-400">
                        <span className="text-lg">{album.year}</span>
                        <span className="text-purple-300">•</span>
                        <span>{album.tracks} faixas</span>
                      </div>

                      <div className="flex gap-3">
                        {album.spotifyUrl && (
                          <motion.a
                            href={album.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 group/btn"
                            style={{
                              boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
                            }}
                          >
                            <svg
                              className="w-6 h-6 text-green-500"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                            </svg>
                          </motion.a>
                        )}

                        {album.appleMusicUrl && (
                          <motion.a
                            href={album.appleMusicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-r from-gray-600/20 to-gray-700/20 rounded-xl border border-gray-600/30"
                          >
                            <Music className="w-6 h-6 text-gray-400" />
                          </motion.a>
                        )}

                        {album.youtubeUrl && (
                          <motion.a
                            href={album.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl border border-red-500/30"
                          >
                            <Youtube className="w-6 h-6 text-red-500" />
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section
        ref={galleryRef}
        id="gallery"
        className="py-20 px-4 md:px-8 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black mb-16 text-center relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500">
              VISUAL ARCHIVES
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10 animate-pulse" />
          </motion.h2>

          {isLoadingGallery ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size={60} />
            </div>
          ) : galleryError ? (
            <ErrorDisplay
              message="Erro ao carregar galeria"
              onRetry={refetchGallery}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {mockPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  variants={scaleIn}
                  custom={index}
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
                      src={photo.thumbnailUrl}
                      alt={photo.caption || `LAOS Photo ${index + 1}`}
                      className="w-full h-[300px] md:h-[400px] object-cover transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
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

                    {/* Photo info overlay */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent"
                    >
                      {photo.caption && (
                        <h4 className="text-lg font-semibold mb-2">
                          {photo.caption}
                        </h4>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        {photo.photographer && (
                          <span>📸 {photo.photographer}</span>
                        )}
                        {photo.date && (
                          <span>
                            {format(parseISO(photo.date), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
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
          )}
        </motion.div>
      </section>

      {/* Contact Section */}
      <section
        ref={contactRef}
        id="contact"
        className="py-20 px-4 md:px-8 relative"
      >
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black mb-16 relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              CONNECT
            </span>
            <div className="absolute -inset-4 blur-3xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 -z-10 animate-pulse" />
          </motion.h2>

          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl animate-pulse" />

            <div
              className="relative bg-black/50 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-purple-500/30 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                boxShadow:
                  "0 0 80px rgba(236, 72, 153, 0.3), inset 0 0 40px rgba(168, 85, 247, 0.1)",
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

              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light tracking-wide">
                Para bookings, imprensa e viagens dimensionais
              </p>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <motion.a
                  href={`mailto:${CONFIG.contact.email}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl font-bold text-lg relative overflow-hidden group"
                  style={{
                    boxShadow:
                      "0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Mail size={24} />
                  <span className="relative z-10">{CONFIG.contact.email}</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              </div>

              {/* Newsletter Form */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Junte-se à nossa dimensão
                </h3>
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="max-w-md mx-auto"
                >
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      required
                      className="w-full px-6 py-4 bg-black/50 border border-purple-500/30 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                      style={{
                        boxShadow: "inset 0 0 20px rgba(168, 85, 247, 0.1)",
                      }}
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={newsletterMutation.status === "pending"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-medium disabled:opacity-50"
                    >
                      {newsletterMutation.status === "pending" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Inscrever"
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-6">
                {[
                  {
                    Icon: Instagram,
                    href: CONFIG.social.instagram,
                    color: "from-pink-500 to-purple-500",
                  },
                  {
                    Icon: Twitter,
                    href: CONFIG.social.twitter,
                    color: "from-blue-400 to-blue-600",
                  },
                  {
                    Icon: Youtube,
                    href: CONFIG.social.youtube,
                    color: "from-red-500 to-red-600",
                  },
                ].map(({ Icon, href, color }, index) => (
                  <motion.a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
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

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-8 h-8 text-pink-500" />
                <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  LAOS
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Last Attempt On Suicide
                <br />
                Transcendendo dimensões desde 2023
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-purple-400">
                Links Rápidos
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#music"
                    className="hover:text-white transition-colors"
                  >
                    Música
                  </a>
                </li>
                <li>
                  <a
                    href="#shows"
                    className="hover:text-white transition-colors"
                  >
                    Shows
                  </a>
                </li>
                <li>
                  <a
                    href="#albums"
                    className="hover:text-white transition-colors"
                  >
                    Álbuns
                  </a>
                </li>
                <li>
                  <a
                    href="#gallery"
                    className="hover:text-white transition-colors"
                  >
                    Galeria
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4 text-purple-400">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{CONFIG.contact.email}</li>
                <li>Bookings: {CONFIG.contact.bookingEmail}</li>
                <li>Imprensa: {CONFIG.contact.pressEmail}</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-purple-500/20">
            <motion.p
              className="text-gray-400 text-sm font-light tracking-wider"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              &copy; 2025 Last Attempt On Suicide. Todos os direitos reservados.
            </motion.p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {scrollProgress > 20 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg z-40"
            style={{
              boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style jsx global>{`
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

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(168, 85, 247, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ec4899, #a855f7);
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a855f7, #ec4899);
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
        }
      `}</style>
    </>
  );
}

/**
 * Componente AlbumArtwork para renderizar arte dos álbuns
 * Implementa designs procedurais baseados em tema
 */
function AlbumArtwork({ theme }: { theme: string }) {
  switch (theme) {
    case "rebellion":
      return (
        <div className="absolute inset-0 bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-900" />

          {/* Glitch lines */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-[2px]"
              style={{
                top: `${i * 10 + 5}%`,
                background:
                  i % 2 === 0
                    ? "rgba(239, 68, 68, 0.8)"
                    : "rgba(168, 85, 247, 0.8)",
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

          {/* Central symbol */}
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
                  filter: "drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))",
                  fontFamily: "monospace",
                }}
              >
                A
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-32 h-32 rounded-full border-8 border-red-500"
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Digital noise */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" /%3E%3C/svg%3E")',
            }}
          />
        </div>
      );

    case "dreams":
      return (
        <div className="absolute inset-0 bg-black overflow-hidden">
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

          {/* Floating clouds */}
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
                y: [`${20 + i * 15}%`, `${30 + i * 10}%`, `${20 + i * 15}%`],
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Center moon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <div
                className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400"
                style={{
                  filter: "drop-shadow(0 0 50px rgba(236, 72, 153, 0.8))",
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
      );

    case "void":
      return (
        <div className="absolute inset-0 bg-black overflow-hidden">
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

          {/* Central void */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div className="relative">
              {/* Rotating rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-purple-500/30"
                  style={{
                    width: `${200 - i * 50}px`,
                    height: `${200 - i * 50}px`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    filter: `drop-shadow(0 0 ${
                      10 + i * 5
                    }px rgba(168, 85, 247, 0.5))`,
                  }}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{
                    duration: 20 + i * 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}

              {/* Black hole */}
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
      );

    default:
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900" />
      );
  }
}
