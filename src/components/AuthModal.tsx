"use client";

import { useState } from "react";
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
} from "lucide-react";
import { signIn, signUp } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
    address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 12345-678)"),
    phone: z
      .string()
      .regex(/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InputFieldProps {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  showToggle?: boolean;
  showPassword?: boolean;
  setShowPassword?: (value: boolean) => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  // Initialize forms with proper default values to ensure controlled behavior
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const signupForm = useForm<SignupData>({
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
    mode: "onChange", // Enable real-time validation
  });

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(data.email, data.password);

      if (result.success) {
        const redirectUrl = "/user";
        window.location.href = redirectUrl;
      } else {
        setError((result.error as string) || "Erro ao fazer login");
      }
    } catch (err) {
      console.error(err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupData) => {
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
        const userRole = "USER";
        const redirectUrl = userRole === "USER" ? "/user" : "/dashboard";
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
  };

  // Properly typed controlled input component
  const InputField = ({
    icon: Icon,
    type = "text",
    placeholder,
    name,
    control,
    error,
    showToggle = false,
  }: InputFieldProps) => (
    <Controller
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name={name as any}
      control={control}
      render={({ field }) => (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center">
            <Icon className="absolute left-4 w-5 h-5 text-purple-400" />

            <input
              type={showToggle ? (showPassword ? "text" : "password") : type}
              placeholder={placeholder}
              value={field.value || ""} // Ensure controlled component with fallback
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="w-full pl-12 pr-12 py-4 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all placeholder:text-gray-500"
            />

            {showToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-purple-400 hover:text-pink-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-2 ml-2"
            >
              {error.message}
            </motion.p>
          )}
        </div>
      )}
    />
  );

  // Reset forms when switching modes to prevent stale data
  const handleModeSwitch = () => {
    const newMode = mode === "login" ? "signup" : "login";
    setMode(newMode);
    setError(null);
    loginForm.reset();
    signupForm.reset();
    setShowPassword(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl animate-pulse" />

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
                      <p className="text-red-400 text-sm text-center">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forms */}
                {mode === "login" ? (
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                  >
                    <InputField
                      icon={Mail}
                      type="email"
                      placeholder="Email"
                      name="email"
                      control={loginForm.control}
                      error={loginForm.formState.errors.email}
                    />

                    <InputField
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
                      disabled={isLoading || !loginForm.formState.isValid}
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
                  >
                    <InputField
                      icon={User}
                      placeholder="Nome completo"
                      name="name"
                      control={signupForm.control}
                      error={signupForm.formState.errors.name}
                    />

                    <InputField
                      icon={Mail}
                      type="email"
                      placeholder="Email"
                      name="email"
                      control={signupForm.control}
                      error={signupForm.formState.errors.email}
                    />

                    <InputField
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

                    <InputField
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

                    <InputField
                      icon={MapPin}
                      placeholder="Endereço completo"
                      name="address"
                      control={signupForm.control}
                      error={signupForm.formState.errors.address}
                    />

                    <InputField
                      icon={MapPin}
                      placeholder="CEP (12345-678)"
                      name="zipCode"
                      control={signupForm.control}
                      error={signupForm.formState.errors.zipCode}
                    />

                    <InputField
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
                      disabled={isLoading || !signupForm.formState.isValid}
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
