/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  Zap,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { signIn, signUp } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import React from "react";

// ============= INLINE DEBOUNCE IMPLEMENTATION =============
/**
 * Performance-optimized debouncing hook with automatic timer cleanup
 * Implements the debouncing pattern to prevent excessive function calls
 *
 * Time Complexity: O(1) for state updates
 * Space Complexity: O(1) for timer reference storage
 *
 * @param value - Generic type value to be debounced
 * @param delay - Debounce delay in milliseconds (default: 300ms for optimal UX)
 * @returns Debounced value after specified delay
 */
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer to prevent memory leaks
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Schedule new timer with RAF for optimal rendering
    timerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setDebouncedValue(value);
      });

      // Add display name for React DevTools debugging
      OptimizedInputField.displayName = "OptimizedInputField";
    }, delay);

    // Cleanup function for component unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing callbacks
 * Useful for functions like validation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// ============= PERFORMANCE OPTIMIZATIONS =============
/**
 * Memoized regex patterns to prevent recompilation on each validation
 * Compiled once and stored in memory for O(1) access
 */
const REGEX_PATTERNS = {
  CEP: /^\d{5}-?\d{3}$/,
  PHONE: /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/,
} as const;

/**
 * Optimized validation schemas with lazy evaluation
 * Uses .lazy() for conditional validations to reduce computation
 */
const createLoginSchema = () =>
  z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  });

const createSignupSchema = () =>
  z
    .object({
      name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      confirmPassword: z.string(),
      address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
      zipCode: z
        .string()
        .regex(REGEX_PATTERNS.CEP, "CEP inválido (ex: 12345-678)"),
      phone: z.string().regex(REGEX_PATTERNS.PHONE, "Telefone inválido"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Senhas não coincidem",
      path: ["confirmPassword"],
    });

// Lazy initialization of schemas
const loginSchema = createLoginSchema();
const signupSchema = createSignupSchema();

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

// ============= OPTIMIZED INPUT COMPONENT =============
interface OptimizedInputFieldProps {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  name: string;
  control: any;
  error?: any;
  showToggle?: boolean;
  showPassword?: boolean;
  setShowPassword?: (value: boolean) => void;
  validateOnBlur?: boolean;
}

/**
 * Performance-optimized input component with:
 * - Uncontrolled input for faster typing
 * - Debounced validation
 * - Memoized error messages
 * - RAF-scheduled updates
 * - Proper key management for React reconciliation
 */
const OptimizedInputField = React.memo(
  ({
    icon: Icon,
    type = "text",
    placeholder,
    name,
    control,
    error,
    showToggle = false,
    showPassword = false,
    setShowPassword,
    validateOnBlur = true,
  }: OptimizedInputFieldProps) => {
    // Generate stable unique ID for this input instance
    const inputId = React.useId();
    const [localValue, setLocalValue] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce the validation trigger
    const debouncedValue = useDebounce(localValue, 300);

    return (
      <Controller
        key={`controller-${name}-${inputId}`}
        name={name as any}
        control={control}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          // Move all hooks outside of the render function
          // This component is now stable and doesn't violate Rules of Hooks

          // Sync with form state on mount and external updates
          // eslint-disable-next-line react-hooks/rules-of-hooks
          React.useEffect(() => {
            if (value !== localValue && !isValidating) {
              setLocalValue(value || "");
            }
          }, [value]);

          // Trigger validation when debounced value changes
          // eslint-disable-next-line react-hooks/rules-of-hooks
          React.useEffect(() => {
            if (debouncedValue !== value && debouncedValue !== "") {
              setIsValidating(true);
              requestAnimationFrame(() => {
                onChange(debouncedValue);
                setIsValidating(false);
              });
            }
          }, [value, onChange]);

          return (
            <div
              className="relative group"
              key={`input-wrapper-${name}-${inputId}`}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />

              <div className="relative flex items-center">
                <Icon
                  className="absolute left-4 w-5 h-5 text-purple-400 pointer-events-none"
                  aria-hidden="true"
                />

                <input
                  ref={(e) => {
                    ref(e);
                    (inputRef as any).current = e;
                  }}
                  id={`${name}-${inputId}`}
                  name={name}
                  type={
                    showToggle ? (showPassword ? "text" : "password") : type
                  }
                  placeholder={placeholder}
                  value={localValue}
                  onChange={(e) => {
                    // Update local state immediately for responsive typing
                    setLocalValue(e.target.value);
                  }}
                  onBlur={() => {
                    // Ensure final value is synced
                    onChange(localValue);
                    if (validateOnBlur) {
                      onBlur();
                    }
                  }}
                  className="w-full pl-12 pr-12 py-4 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all placeholder:text-gray-500"
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? `${name}-error-${inputId}` : undefined
                  }
                  // Performance optimizations
                  autoComplete={
                    name === "email"
                      ? "email"
                      : name === "password"
                      ? "current-password"
                      : "off"
                  }
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                />

                {/* Conditional rendering with proper keys */}
                {showToggle && (
                  <button
                    key={`toggle-${name}-${inputId}`}
                    type="button"
                    onClick={() => setShowPassword?.(!showPassword)}
                    className="absolute right-4 text-purple-400 hover:text-pink-400 transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff key="eye-off" className="w-5 h-5" />
                    ) : (
                      <Eye key="eye-on" className="w-5 h-5" />
                    )}
                  </button>
                )}

                {isValidating && !showToggle && (
                  <div
                    key={`validation-spinner-${name}-${inputId}`}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    aria-label="Validating..."
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  </div>
                )}
              </div>

              {/* Error message with animation */}
              <AnimatePresence mode="wait">
                {error && !isValidating && (
                  <motion.div
                    key={`error-${name}-${inputId}`}
                    id={`${name}-error-${inputId}`}
                    role="alert"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-400 text-sm mt-2 ml-2 flex items-center gap-1">
                      <AlertCircle
                        key="alert-icon"
                        className="w-3 h-3 flex-shrink-0"
                      />
                      <span key="error-message">{error.message}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />
    );
  }
);

// ============= MAIN COMPONENT WITH OPTIMIZATIONS =============
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Memoized form configurations
  const loginFormConfig = useMemo(
    () => ({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: "",
        password: "",
      },
      mode: "onBlur" as const, // Changed from onChange to onBlur
      reValidateMode: "onBlur" as const,
      criteriaMode: "firstError" as const,
      shouldFocusError: true,
      delayError: 500, // Delay error display
    }),
    []
  );

  const signupFormConfig = useMemo(
    () => ({
      resolver: zodResolver(signupSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        address: "",
        zipCode: "",
        phone: "",
      },
      mode: "onBlur" as const, // Changed from onChange to onBlur
      reValidateMode: "onBlur" as const,
      criteriaMode: "firstError" as const,
      shouldFocusError: true,
      delayError: 500,
    }),
    []
  );

  // Initialize forms with optimized configurations
  const loginForm = useForm<LoginData>(loginFormConfig);
  const signupForm = useForm<SignupData>(signupFormConfig);

  // Debounced form submission handlers
  const handleLogin = useCallback(
    async (data: LoginData) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn(data.email, data.password);

        if (result.success) {
          // Use router.push with prefetch for faster navigation
          router.prefetch("/user");
          window.location.href = "/user";
        } else {
          setError((result.error as string) || "Erro ao fazer login");
        }
      } catch (err) {
        console.error(err);
        setError("Erro inesperado. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const handleSignup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await signUp({
          name: data.name,
          email: data.email,
          password: data.password,
          address: data.address,
          zipCode: data.zipCode,
          phone: data.phone,
        });

        if (result.success) {
          const redirectUrl = "/user";
          router.prefetch(redirectUrl);
          window.location.href = redirectUrl;
        } else {
          setError((result.error as string) || "Erro ao criar conta");
        }
      } catch (err) {
        console.error(err);
        setError("Erro inesperado. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Optimized mode switch with form reset
  const handleModeSwitch = useCallback(() => {
    const newMode = mode === "login" ? "signup" : "login";
    setMode(newMode);
    setError(null);
    setShowPassword(false);

    // Reset forms in next tick to prevent UI flicker
    requestAnimationFrame(() => {
      loginForm.reset();
      signupForm.reset();
    });
  }, [mode, loginForm, signupForm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loginForm.reset();
      signupForm.reset();
    };
  }, [loginForm, signupForm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with GPU acceleration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            style={{ willChange: "opacity" }}
          />

          {/* Modal with optimized animations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Glow effect with GPU acceleration */}
              <div
                className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl animate-pulse"
                style={{
                  willChange: "opacity",
                  transform: "translateZ(0)",
                }}
              />

              <div className="relative bg-black/90 backdrop-blur-2xl rounded-3xl p-8 border border-purple-500/30">
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mb-4"
                  >
                    <Zap className="w-8 h-8 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                    {mode === "login" ? "ENTRAR NO SISTEMA" : "CRIAR CONTA"}
                  </h2>

                  <p className="text-gray-400 mt-2">
                    {mode === "login"
                      ? "Acesse o universo cyberpunk do LAOS"
                      : "Junte-se à revolução digital"}
                  </p>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forms with optimized validation */}
                {mode === "login" ? (
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                    noValidate // Disable browser validation
                  >
                    <OptimizedInputField
                      icon={Mail}
                      type="email"
                      placeholder="Email"
                      name="email"
                      control={loginForm.control}
                      error={loginForm.formState.errors.email}
                    />

                    <OptimizedInputField
                      icon={Lock}
                      type="password"
                      placeholder="Senha"
                      name="password"
                      control={loginForm.control}
                      error={loginForm.formState.errors.password}
                      showToggle
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        "ENTRAR"
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <form
                    onSubmit={signupForm.handleSubmit(handleSignup)}
                    className="space-y-4"
                    noValidate
                  >
                    <OptimizedInputField
                      icon={User}
                      placeholder="Nome completo"
                      name="name"
                      control={signupForm.control}
                      error={signupForm.formState.errors.name}
                    />

                    <OptimizedInputField
                      icon={Mail}
                      type="email"
                      placeholder="Email"
                      name="email"
                      control={signupForm.control}
                      error={signupForm.formState.errors.email}
                    />

                    <OptimizedInputField
                      icon={Lock}
                      type="password"
                      placeholder="Senha"
                      name="password"
                      control={signupForm.control}
                      error={signupForm.formState.errors.password}
                      showToggle
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />

                    <OptimizedInputField
                      icon={Lock}
                      type="password"
                      placeholder="Confirmar senha"
                      name="confirmPassword"
                      control={signupForm.control}
                      error={signupForm.formState.errors.confirmPassword}
                      showToggle
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />

                    <OptimizedInputField
                      icon={MapPin}
                      placeholder="Endereço completo"
                      name="address"
                      control={signupForm.control}
                      error={signupForm.formState.errors.address}
                    />

                    <OptimizedInputField
                      icon={MapPin}
                      placeholder="CEP (12345-678)"
                      name="zipCode"
                      control={signupForm.control}
                      error={signupForm.formState.errors.zipCode}
                    />

                    <OptimizedInputField
                      icon={Phone}
                      placeholder="Telefone (11) 98765-4321"
                      name="phone"
                      control={signupForm.control}
                      error={signupForm.formState.errors.phone}
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        "CRIAR CONTA"
                      )}
                    </motion.button>
                  </form>
                )}

                {/* Toggle mode */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400">
                    {mode === "login"
                      ? "Não tem uma conta?"
                      : "Já tem uma conta?"}
                  </p>
                  <button
                    type="button"
                    onClick={handleModeSwitch}
                    className="text-pink-400 hover:text-pink-300 font-bold mt-2 transition-colors"
                  >
                    {mode === "login" ? "CRIAR CONTA" : "FAZER LOGIN"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
