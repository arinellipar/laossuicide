import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  AlertCircle,
  Loader2,
  Github,
  Chrome,
  ShieldCheck,
} from "lucide-react";

/**
 * Cyberpunk Login Component
 * Implements advanced animation choreography with GPU optimization
 */
export default function CyberpunkLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form state management
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate email
  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Invalid email address";
    return "";
  };

  // Validate password
  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    return "";
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error on change
    if (field === "email" || field === "password") {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFormErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real implementation, make actual API call
      console.log("Login data:", formData);

      // Redirect to dashboard
      // window.location.href = "/dashboard"
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Floating particles effect
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-pink-500 rounded-full"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: "-10%",
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
          style={{
            filter: "blur(1px)",
            boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)",
          }}
        />
      ))}
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
      <FloatingParticles />

      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main login card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", damping: 20 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />

          {/* Card content */}
          <div
            className="relative bg-black/80 backdrop-blur-2xl rounded-3xl p-8 border border-purple-500/30"
            style={{
              boxShadow:
                "0 0 50px rgba(236, 72, 153, 0.3), inset 0 0 30px rgba(168, 85, 247, 0.1)",
            }}
          >
            {/* Logo/Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block relative mb-4"
              >
                <Zap className="w-16 h-16 text-pink-500" />
                <div className="absolute inset-0 blur-xl bg-pink-500/50 animate-pulse" />
              </motion.div>

              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                ENTER THE VOID
              </h1>
              <p className="text-gray-400 mt-2">Access your LAOS account</p>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login form */}
            <div className="space-y-6">
              {/* Email field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`
                      w-full px-4 py-3 pl-12 bg-black/50 border rounded-xl
                      text-white placeholder-gray-500 backdrop-blur-xl
                      transition-all duration-300 outline-none
                      ${
                        formErrors.email
                          ? "border-red-500/50 focus:border-red-500"
                          : "border-purple-500/30 focus:border-pink-500"
                      }
                      focus:shadow-[0_0_20px_rgba(236,72,153,0.5)]
                    `}
                    placeholder="your@email.com"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {formErrors.email}
                  </p>
                )}
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                    className={`
                      w-full px-4 py-3 pl-12 pr-12 bg-black/50 border rounded-xl
                      text-white placeholder-gray-500 backdrop-blur-xl
                      transition-all duration-300 outline-none
                      ${
                        formErrors.password
                          ? "border-red-500/50 focus:border-red-500"
                          : "border-purple-500/30 focus:border-pink-500"
                      }
                      focus:shadow-[0_0_20px_rgba(236,72,153,0.5)]
                    `}
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-pink-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {formErrors.password}
                  </p>
                )}
              </motion.div>

              {/* Remember me & Forgot password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      handleInputChange("rememberMe", e.target.checked)
                    }
                    className="w-4 h-4 bg-black/50 border border-purple-500/30 rounded text-pink-500 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-purple-400 hover:text-pink-400 transition-colors"
                >
                  Forgot password?
                </a>
              </motion.div>

              {/* Submit button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={handleSubmit}
                disabled={isLoading}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg relative overflow-hidden
                  transition-all duration-300 flex items-center justify-center gap-3
                  ${
                    isLoading
                      ? "bg-gray-800 cursor-not-allowed"
                      : "bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105"
                  }
                `}
                style={{
                  boxShadow: isLoading
                    ? "none"
                    : "0 0 30px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>ACCESS SYSTEM</span>
                  </>
                )}

                {/* Hover effect */}
                {!isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-500">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Social login buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="px-4 py-3 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-500/10 transition-all"
                >
                  <Chrome className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="px-4 py-3 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-500/10 transition-all"
                >
                  <Github className="w-5 h-5 text-gray-300" />
                  <span className="text-gray-300">GitHub</span>
                </motion.button>
              </div>
            </div>

            {/* Sign up link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-400">
                Don{"'"}t have an account?{" "}
                <a
                  href="/auth/register"
                  className="text-pink-400 hover:text-pink-300 transition-colors font-semibold"
                >
                  Join the rebellion
                </a>
              </p>
            </motion.div>

            {/* Security badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Secured with 256-bit encryption</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
