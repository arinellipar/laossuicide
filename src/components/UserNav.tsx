"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Calendar,
  ShoppingBag,
  Music,
  Heart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useState } from "react";

interface UserNavProps {
  user: {
    name: string | null;
    email: string | null;
    role: string;
  };
}

export default function UserNav({ user }: UserNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/user", icon: Home, label: "Início" },
    { href: "/user/shows", icon: Calendar, label: "Meus Shows" },
    { href: "/user/merch", icon: ShoppingBag, label: "Loja" },
    { href: "/user/music", icon: Music, label: "Músicas" },
    { href: "/user/favorites", icon: Heart, label: "Favoritos" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-2xl bg-black/50 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/user">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                    LAOS
                  </h1>
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-500 to-purple-500 opacity-50 -z-10" />
                </div>
                <span className="text-sm text-gray-400 hidden md:block">
                  FAN ZONE
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-300">
                  {user.name || "Fã LAOS"}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              {/* Sign Out Button */}
              <form
                action={async () => {
                  await signOut();
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/50 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">Sair</span>
                </motion.button>
              </form>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-0 right-0 z-30 backdrop-blur-2xl bg-black/90 border-b border-purple-500/20 overflow-hidden md:hidden"
      >
        <div className="p-4 space-y-2">
          {/* User Info Mobile */}
          <div className="pb-4 mb-4 border-b border-purple-500/20">
            <p className="font-semibold text-gray-300">
              {user.name || "Fã LAOS"}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Mobile Nav Items */}
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          ))}

          {/* Sign Out Mobile */}
          <form
            action={async () => {
              await signOut();
            }}
            className="pt-4"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/50 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Sair</span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
