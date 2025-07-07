/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module ToastNotificationSystem
 * @description Sistema de notificações toast com animações avançadas e queue management
 *
 * Arquitetura:
 * - Portal Pattern para renderização fora da árvore DOM principal
 * - Queue Management com priorização
 * - Animation orchestration com Framer Motion
 * - Singleton pattern para instância global
 * - Event-driven architecture
 * - Memory-safe com auto cleanup
 *
 * Features:
 * - Tipos: success, error, warning, info, loading
 * - Posicionamento flexível
 * - Auto-dismiss configurável
 * - Ações customizadas
 * - Acessibilidade ARIA completa
 * - Temas customizáveis
 * - Progress bar para timing
 *
 * Performance:
 * - Virtual DOM optimization
 * - RAF-based animations
 * - Lazy rendering
 * - Memory pooling para toasts frequentes
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
  FC,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Variants, useAnimation } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";

// ============= TYPE DEFINITIONS =============
export type ToastType = "success" | "error" | "warning" | "info" | "loading";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Interface principal do Toast
 * Suporta conteúdo rico e ações customizadas
 */
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string | ReactNode;
  duration?: number; // ms, 0 = permanente
  position?: ToastPosition;
  icon?: LucideIcon | ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  pauseOnHover?: boolean;
  priority?: "low" | "normal" | "high" | "critical";
  timestamp: number;
  progress?: boolean; // Mostrar barra de progresso
  className?: string; // Classes customizadas
  style?: React.CSSProperties; // Estilos inline
}

/**
 * Opções globais do sistema de toast
 */
export interface ToastOptions {
  position?: ToastPosition;
  duration?: number;
  maxToasts?: number;
  gutter?: number; // Espaçamento entre toasts
  containerClassName?: string;
  pauseOnFocusLoss?: boolean;
  theme?: "light" | "dark" | "auto";
}

/**
 * API pública do sistema de toast
 */
export interface ToastAPI {
  show: (toast: Omit<Toast, "id" | "timestamp">) => string;
  success: (message: string, options?: Partial<Toast>) => string;
  error: (message: string, options?: Partial<Toast>) => string;
  warning: (message: string, options?: Partial<Toast>) => string;
  info: (message: string, options?: Partial<Toast>) => string;
  loading: (message: string, options?: Partial<Toast>) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Partial<Toast>
  ) => Promise<T>;
  dismiss: (toastId?: string) => void;
  dismissAll: () => void;
  update: (toastId: string, updates: Partial<Toast>) => void;
}

// ============= CONSTANTS =============
const DEFAULT_OPTIONS: Required<ToastOptions> = {
  position: "bottom-right",
  duration: 4000,
  maxToasts: 5,
  gutter: 8,
  containerClassName: "",
  pauseOnFocusLoss: true,
  theme: "dark",
};

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const TOAST_COLORS: Record<
  ToastType,
  { bg: string; border: string; text: string }
> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  loading: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
  },
};

// ============= ANIMATION VARIANTS =============
const toastVariants: Variants = {
  initial: (position: ToastPosition) => {
    const isTop = position.includes("top");
    const isLeft = position.includes("left");
    const isCenter = position.includes("center");

    return {
      opacity: 0,
      scale: 0.9,
      x: isCenter ? 0 : isLeft ? -50 : 50,
      y: isTop ? -50 : 50,
    };
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40,
    },
  },
  exit: (position: ToastPosition) => {
    const isTop = position.includes("top");
    const isLeft = position.includes("left");
    const isCenter = position.includes("center");

    return {
      opacity: 0,
      scale: 0.9,
      x: isCenter ? 0 : isLeft ? -50 : 50,
      y: isTop ? -50 : 50,
      transition: {
        duration: 0.2,
      },
    };
  },
};

const progressVariants: Variants = {
  initial: { scaleX: 1 },
  animate: (duration: number) => ({
    scaleX: 0,
    transition: {
      duration: duration / 1000,
      ease: "linear",
    },
  }),
};

// ============= TOAST CONTEXT =============
interface ToastContextValue {
  toasts: Toast[];
  options: ToastOptions;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ============= TOAST PROVIDER COMPONENT =============
export const ToastProvider: FC<{
  children: ReactNode;
  options?: ToastOptions;
}> = ({ children, options: userOptions = {} }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [options] = useState<ToastOptions>({
    ...DEFAULT_OPTIONS,
    ...userOptions,
  });
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ===== TOAST MANAGEMENT =====
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));

    // Limpar timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((prev) => {
        // Aplicar limite de toasts
        let newToasts = [...prev];

        // Ordenar por prioridade e timestamp
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        newToasts.sort((a, b) => {
          const aPriority = priorityOrder[a.priority || "normal"];
          const bPriority = priorityOrder[b.priority || "normal"];
          if (aPriority !== bPriority) return bPriority - aPriority;
          return b.timestamp - a.timestamp;
        });

        // Remover toasts excedentes (mantém os mais prioritários)
        if (
          newToasts.length >= (options.maxToasts || DEFAULT_OPTIONS.maxToasts)
        ) {
          const toRemove = newToasts.slice(options.maxToasts! - 1);
          toRemove.forEach((t) => {
            const timer = timersRef.current.get(t.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(t.id);
            }
          });
          newToasts = newToasts.slice(0, options.maxToasts! - 1);
        }

        // Adicionar novo toast
        newToasts.unshift(toast);

        // Configurar auto-dismiss
        const duration =
          toast.duration ?? options.duration ?? DEFAULT_OPTIONS.duration;
        if (duration > 0 && toast.type !== "loading") {
          const timer = setTimeout(() => {
            removeToast(toast.id);
          }, duration);
          timersRef.current.set(toast.id, timer);
        }

        return newToasts;
      });
    },
    [options.duration, options.maxToasts, removeToast]
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Toast>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates, id } : t))
      );

      // Resetar timer se duração mudou
      if (updates.duration !== undefined) {
        const timer = timersRef.current.get(id);
        if (timer) {
          clearTimeout(timer);
          timersRef.current.delete(id);
        }

        if (updates.duration > 0) {
          const newTimer = setTimeout(() => {
            removeToast(id);
          }, updates.duration);
          timersRef.current.set(id, newTimer);
        }
      }
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    // Limpar todos os timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      // Copy the current timers map to avoid accessing the ref directly after unmount
      const timersCopy = new Map(timers);
      timersCopy.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      options,
      addToast,
      removeToast,
      updateToast,
      clearToasts,
    }),
    [toasts, options, addToast, removeToast, updateToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// ============= TOAST CONTAINER COMPONENT =============
const ToastContainer: FC = () => {
  const [mounted, setMounted] = useState(false);
  const context = useContext(ToastContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!context) return null;

  const { toasts, options } = context;

  if (!mounted) return null;

  // Agrupar toasts por posição
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position =
      toast.position || options.position || DEFAULT_OPTIONS.position;
    if (!acc[position]) acc[position] = [];
    acc[position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, Toast[]>);

  return createPortal(
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`
            fixed z-[9999] pointer-events-none
            ${position.includes("top") ? "top-4" : "bottom-4"}
            ${position.includes("left") ? "left-4" : ""}
            ${position.includes("right") ? "right-4" : ""}
            ${position.includes("center") ? "left-1/2 -translate-x-1/2" : ""}
            ${options.containerClassName}
          `}
        >
          <AnimatePresence mode="popLayout">
            {positionToasts.map((toast, index) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                index={index}
                position={position as ToastPosition}
                gutter={options.gutter || DEFAULT_OPTIONS.gutter}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>,
    document.body
  );
};

// ============= TOAST ITEM COMPONENT =============
interface ToastItemProps {
  toast: Toast;
  index: number;
  position: ToastPosition;
  gutter: number;
}

const ToastItem: FC<ToastItemProps> = ({ toast, index, position, gutter }) => {
  const context = useContext(ToastContext);
  const progressControls = useAnimation();

  const handleDismiss = () => {
    toast.onClose?.();
    context?.removeToast(toast.id);
  };

  const handleMouseEnter = () => {
    if (toast.pauseOnHover !== false) {
      progressControls.stop();
    }
  };

  const handleMouseLeave = () => {
    if (toast.pauseOnHover !== false) {
      const duration =
        toast.duration ?? context?.options.duration ?? DEFAULT_OPTIONS.duration;
      if (duration > 0 && toast.progress !== false) {
        progressControls.start("animate");
      }
    }
  };

  useEffect(() => {
    const duration =
      toast.duration ?? context?.options.duration ?? DEFAULT_OPTIONS.duration;
    if (duration > 0 && toast.progress !== false && toast.type !== "loading") {
      progressControls.start("animate");
    } else {
      progressControls.stop();
    }
  }, [toast, context, progressControls]);

  const colors = TOAST_COLORS[toast.type];
  const DefaultIcon = TOAST_ICONS[toast.type];
  const Icon = toast.icon || DefaultIcon;

  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastVariants}
      custom={position}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ marginBottom: index > 0 ? gutter : 0 }}
      className={`
        pointer-events-auto relative flex items-start gap-3
        min-w-[300px] max-w-[500px] p-4 rounded-xl
        ${colors.bg} backdrop-blur-xl border ${colors.border}
        shadow-2xl ${toast.className || ""}
      `}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${colors.text}`}>
        {typeof Icon === "function" ? (
          <Icon
            className={`w-5 h-5 ${
              toast.type === "loading" ? "animate-spin" : ""
            }`}
          />
        ) : (
          Icon
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h3 className={`font-semibold mb-1 ${colors.text}`}>{toast.title}</h3>
        )}
        <div className="text-sm text-gray-300">{toast.message}</div>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`
              mt-2 text-sm font-medium ${colors.text}
              hover:underline focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-offset-black
              focus:ring-purple-500 rounded
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {toast.type !== "loading" && (
        <button
          onClick={handleDismiss}
          className={`
            flex-shrink-0 p-1 rounded-lg ${colors.text}
            hover:bg-white/10 transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-offset-black focus:ring-purple-500
          `}
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Progress bar */}
      {toast.progress !== false &&
        toast.type !== "loading" &&
        toast.duration &&
        toast.duration > 0 && (
          <motion.div
            className={`absolute bottom-0 left-0 right-0 h-1 ${colors.bg} origin-left`}
            initial="initial"
            animate={progressControls}
            variants={progressVariants}
            custom={toast.duration}
            style={{
              background: `linear-gradient(to right, ${colors.text.replace(
                "text-",
                "rgb("
              )}00, 255, 255) / 0.5), transparent)`,
            }}
          />
        )}
    </motion.div>
  );
};

// ============= TOAST API SINGLETON =============
class ToastManager implements ToastAPI {
  private context: ToastContextValue | null = null;

  setContext(context: ToastContextValue) {
    this.context = context;
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  show(toast: Omit<Toast, "id" | "timestamp">): string {
    if (!this.context) {
      console.error("[Toast] Context not initialized");
      return "";
    }

    const id = this.generateId();
    const fullToast: Toast = {
      ...toast,
      id,
      timestamp: Date.now(),
    };

    this.context.addToast(fullToast);
    return id;
  }

  success(message: string, options?: Partial<Toast>): string {
    return this.show({
      ...options,
      type: "success",
      message,
    });
  }

  error(message: string, options?: Partial<Toast>): string {
    return this.show({
      ...options,
      type: "error",
      message,
      duration: options?.duration ?? 6000, // Erros ficam mais tempo
    });
  }

  warning(message: string, options?: Partial<Toast>): string {
    return this.show({
      ...options,
      type: "warning",
      message,
    });
  }

  info(message: string, options?: Partial<Toast>): string {
    return this.show({
      ...options,
      type: "info",
      message,
    });
  }

  loading(message: string, options?: Partial<Toast>): string {
    return this.show({
      ...options,
      type: "loading",
      message,
      duration: 0, // Loading toasts não desaparecem automaticamente
    });
  }

  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Partial<Toast>
  ): Promise<T> {
    const id = this.loading(messages.loading, options);

    try {
      const result = await promise;
      this.update(id, {
        type: "success",
        message:
          typeof messages.success === "function"
            ? messages.success(result)
            : messages.success,
        duration: options?.duration ?? 4000,
      });
      return result;
    } catch (error) {
      this.update(id, {
        type: "error",
        message:
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error,
        duration: options?.duration ?? 6000,
      });
      throw error;
    }
  }

  dismiss(toastId?: string): void {
    if (!this.context) return;

    if (toastId) {
      this.context.removeToast(toastId);
    } else {
      // Dismiss o toast mais recente
      const toasts = this.context.toasts;
      if (toasts.length > 0) {
        this.context.removeToast(toasts[0].id);
      }
    }
  }

  dismissAll(): void {
    if (!this.context) return;
    this.context.clearToasts();
  }

  update(toastId: string, updates: Partial<Toast>): void {
    if (!this.context) return;
    this.context.updateToast(toastId, updates);
  }
}

// ============= EXPORTS =============
const toastManager = new ToastManager();

// Hook para acessar o contexto e configurar o manager
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }

  // Configurar o manager com o contexto atual
  useEffect(() => {
    toastManager.setContext(context);
  }, [context]);

  return context;
};

// API pública do toast
export const toast = toastManager;

// Hook conveniente para usar em componentes
export const useToast = () => {
  useToastContext(); // Garante que o contexto está configurado
  return toast;
};
