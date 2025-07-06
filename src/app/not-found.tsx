"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-[200px] animate-pulse" />
        </div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative mb-8"
        >
          <h1 className="text-[150px] md:text-[200px] font-black leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              404
            </span>
          </h1>
          <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-30 -z-10" />

          {/* Glitch effect */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            animate={{
              x: [-2, 2, -2, 2, 0],
              opacity: [0, 1, 0, 1, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <h1 className="text-[150px] md:text-[200px] font-black leading-none text-red-500 opacity-50">
              404
            </h1>
          </motion.div>
        </motion.div>

        {/* Error message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Página Perdida no Cyberespaço
          </h2>
          <p className="text-xl text-gray-400 max-w-md mx-auto">
            Parece que você encontrou uma falha na matriz. Esta página não
            existe ou foi movida para outra dimensão.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2 relative overflow-hidden group"
              style={{
                boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
              }}
            >
              <Home className="w-5 h-5" />
              <span>Voltar ao Início</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>

          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl border border-purple-500/50 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 font-bold flex items-center gap-2 hover:border-pink-500/50 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span>Dashboard</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-40 h-40 border-2 border-pink-500/20 rounded-full"
          />
        </div>

        <div className="absolute -bottom-20 -right-20">
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-60 h-60 border-2 border-purple-500/20 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
