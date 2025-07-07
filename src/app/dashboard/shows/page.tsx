"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Ticket, Users, Zap } from "lucide-react";
import { useState } from "react";

export default function ShowsPage() {
  const [selectedShow, setSelectedShow] = useState<number | null>(null);

  const upcomingShows = [
    {
      id: 1,
      date: "2025-07-15",
      venue: "The Vortex Club",
      city: "São Paulo",
      capacity: 2000,
      ticketsSold: 1850,
      price: "R$ 120,00",
      doorTime: "20:00",
      showTime: "22:00",
      vip: true,
      description: "Show especial com set acústico exclusivo e meet & greet",
    },
    {
      id: 2,
      date: "2025-07-22",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      capacity: 3000,
      ticketsSold: 2100,
      price: "R$ 100,00",
      doorTime: "19:00",
      showTime: "21:00",
      vip: true,
      description: "Apresentação completa do novo álbum com visuais 3D",
    },
    {
      id: 3,
      date: "2025-08-05",
      venue: "Dark Matter",
      city: "Belo Horizonte",
      capacity: 1500,
      ticketsSold: 1500,
      price: "R$ 90,00",
      doorTime: "20:00",
      showTime: "22:00",
      vip: false,
      soldOut: true,
      description: "Show intimista com participações especiais",
    },
    {
      id: 4,
      date: "2025-08-20",
      venue: "Neon Festival",
      city: "Curitiba",
      capacity: 5000,
      ticketsSold: 3200,
      price: "R$ 150,00",
      doorTime: "14:00",
      showTime: "18:00",
      vip: true,
      festival: true,
      description: "Festival com 10 bandas, LAOS como headliner",
    },
  ];

  const pastShows = [
    {
      date: "2024-12-20",
      venue: "Audio Club",
      city: "São Paulo",
      photos: 124,
      videos: 15,
    },
    {
      date: "2024-11-15",
      venue: "Circo Voador",
      city: "Rio de Janeiro",
      photos: 89,
      videos: 12,
    },
  ];

  const getTicketPercentage = (sold: number, capacity: number) => {
    return (sold / capacity) * 100;
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              EXPERIÊNCIAS AO VIVO
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Conecte-se com a energia cyberpunk do LAOS
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { label: "Shows em 2025", value: "24", icon: Calendar },
            { label: "Cidades", value: "18", icon: MapPin },
            { label: "Fãs ao vivo", value: "45K+", icon: Users },
            { label: "Horas no palco", value: "120+", icon: Clock },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-6 backdrop-blur-xl border border-purple-500/30 text-center"
            >
              <stat.icon className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Upcoming Shows */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Zap className="w-8 h-8 text-pink-400" />
            Próximos Shows
          </h2>

          <div className="space-y-6">
            {upcomingShows.map((show, index) => (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() =>
                  setSelectedShow(selectedShow === show.id ? null : show.id)
                }
                className="relative cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-0 hover:opacity-60 transition-opacity" />

                <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Show Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg backdrop-blur-xl border border-pink-500/30">
                          <p className="text-sm text-gray-400">
                            {new Date(show.date)
                              .toLocaleDateString("pt-BR", { weekday: "short" })
                              .toUpperCase()}
                          </p>
                          <p className="text-2xl font-bold">
                            {new Date(show.date).getDate()}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(show.date)
                              .toLocaleDateString("pt-BR", { month: "short" })
                              .toUpperCase()}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold mb-1">
                            {show.venue}
                          </h3>
                          <div className="flex items-center gap-4 text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {show.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {show.showTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-2 mb-3">
                        {show.vip && (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">
                            VIP Disponível
                          </span>
                        )}
                        {show.festival && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                            Festival
                          </span>
                        )}
                        {show.soldOut && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">
                            Esgotado
                          </span>
                        )}
                      </div>

                      {/* Ticket Progress */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">
                            Ingressos vendidos
                          </span>
                          <span className="text-pink-400 font-semibold">
                            {show.ticketsSold} / {show.capacity}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${getTicketPercentage(
                                show.ticketsSold,
                                show.capacity
                              )}%`,
                            }}
                            transition={{
                              duration: 1,
                              delay: 0.5 + index * 0.1,
                            }}
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price & Button */}
                    <div className="text-right">
                      <p className="text-3xl font-bold text-pink-400 mb-3">
                        {show.price}
                      </p>
                      {!show.soldOut ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Ticket className="w-5 h-5" />
                          Comprar Ingresso
                        </motion.button>
                      ) : (
                        <div className="px-6 py-3 bg-gray-800 rounded-xl font-bold text-gray-500">
                          Esgotado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: selectedShow === show.id ? "auto" : 0,
                      opacity: selectedShow === show.id ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-purple-500/20">
                      <p className="text-gray-400 mb-4">{show.description}</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-1">
                            Abertura dos portões
                          </p>
                          <p className="text-xl font-semibold">
                            {show.doorTime}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-1">
                            Início do show
                          </p>
                          <p className="text-xl font-semibold">
                            {show.showTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Past Shows */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-8">Shows Anteriores</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {pastShows.map((show, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-6 backdrop-blur-xl border border-gray-700/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{show.venue}</h3>
                    <p className="text-gray-400">{show.city}</p>
                  </div>
                  <p className="text-gray-500">
                    {new Date(show.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-pink-400">{show.photos}</span> fotos
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-purple-400">{show.videos}</span>{" "}
                    vídeos
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
