"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ShoppingBag,
  Ticket,
  Music,
  Heart,
  Clock,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

export default function UserPage() {
  const upcomingShows = [
    {
      date: "2025-07-15",
      venue: "The Vortex Club",
      city: "São Paulo",
      hasTicket: true,
    },
    {
      date: "2025-07-22",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      hasTicket: false,
    },
  ];

  const favoriteAlbums = [
    {
      title: "Cyber Rebellion",
      year: 2024,
      image:
        "https://images.unsplash.com/photo-1598387993441-a364f854e29d?w=300&h=300&fit=crop",
    },
    {
      title: "Neon Dreams",
      year: 2023,
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    },
  ];

  const recentPurchases = [
    {
      item: "Camiseta Cyber Rebellion",
      date: "2025-06-20",
      price: "R$ 89,90",
      status: "Enviado",
    },
    {
      item: "Ingresso - São Paulo",
      date: "2025-06-15",
      price: "R$ 120,00",
      status: "Confirmado",
    },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            MEU ESPAÇO LAOS
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Acompanhe shows, músicas favoritas e suas compras
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            icon: Ticket,
            label: "Próximos Shows",
            value: "2",
            gradient: "from-pink-500 to-rose-500",
          },
          {
            icon: Heart,
            label: "Músicas Favoritas",
            value: "24",
            gradient: "from-purple-500 to-indigo-500",
          },
          {
            icon: ShoppingBag,
            label: "Compras",
            value: "5",
            gradient: "from-cyan-500 to-blue-500",
          },
          {
            icon: Clock,
            label: "Horas de Música",
            value: "127",
            gradient: "from-green-500 to-emerald-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} inline-flex mb-4`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>

              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My Shows Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-pink-400" />
            Meus Shows
          </h2>

          <div className="space-y-4">
            {upcomingShows.map((show, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-bold mb-2">{show.venue}</p>
                    <p className="text-gray-400 mb-1">{show.city}</p>
                    <p className="text-sm text-purple-400">
                      {new Date(show.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {show.hasTicket ? (
                    <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                      <p className="text-green-400 font-semibold">
                        Ingresso Confirmado
                      </p>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold"
                    >
                      Comprar Ingresso
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Favorite Albums */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-400" />
            Álbuns Favoritos
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {favoriteAlbums.map((album, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative bg-black/50 backdrop-blur-xl rounded-xl overflow-hidden border border-purple-500/30">
                  <Image
                    src={album.image}
                    alt={album.title}
                    width={300}
                    height={300}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-4">
                    <p className="font-bold">{album.title}</p>
                    <p className="text-sm text-gray-400">{album.year}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Purchases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-pink-400" />
          Compras Recentes
        </h2>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-purple-500/30">
                <tr>
                  <th className="text-left p-4 text-gray-400">Item</th>
                  <th className="text-left p-4 text-gray-400">Data</th>
                  <th className="text-left p-4 text-gray-400">Valor</th>
                  <th className="text-left p-4 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-purple-500/10 hover:bg-purple-500/5"
                  >
                    <td className="p-4">{purchase.item}</td>
                    <td className="p-4 text-gray-400">
                      {new Date(purchase.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4 text-pink-400 font-semibold">
                      {purchase.price}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          purchase.status === "Enviado"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Music Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-xl border border-purple-500/30"
      >
        <div className="flex items-center gap-4 mb-6">
          <TrendingUp className="w-8 h-8 text-pink-400" />
          <h2 className="text-3xl font-bold">Suas Estatísticas</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 mb-2">Música mais ouvida</p>
            <p className="text-2xl font-bold text-pink-400">Broken Mirrors</p>
            <p className="text-sm text-gray-500">342 reproduções</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Tempo total</p>
            <p className="text-2xl font-bold text-purple-400">127 horas</p>
            <p className="text-sm text-gray-500">Nos últimos 30 dias</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Shows assistidos</p>
            <p className="text-2xl font-bold text-cyan-400">8 shows</p>
            <p className="text-sm text-gray-500">Desde 2023</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
