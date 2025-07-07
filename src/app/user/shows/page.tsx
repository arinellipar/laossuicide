"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Ticket, Clock, CheckCircle } from "lucide-react";

export default function UserShowsPage() {
  const myShows = [
    {
      id: 1,
      date: "2025-07-15",
      venue: "The Vortex Club",
      city: "São Paulo",
      status: "confirmed",
      ticketNumber: "LAOS-2025-001234",
    },
    {
      id: 2,
      date: "2024-12-20",
      venue: "Audio Club",
      city: "São Paulo",
      status: "attended",
      ticketNumber: "LAOS-2024-005678",
    },
  ];

  const availableShows = [
    {
      id: 3,
      date: "2025-07-22",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      price: "R$ 100,00",
      available: true,
    },
    {
      id: 4,
      date: "2025-08-05",
      venue: "Dark Matter",
      city: "Belo Horizonte",
      price: "R$ 90,00",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            MEUS SHOWS
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Gerencie seus ingressos e descubra próximos shows
        </p>
      </motion.div>

      {/* My Tickets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Ticket className="w-8 h-8 text-pink-400" />
          Meus Ingressos
        </h2>

        <div className="grid gap-6">
          {myShows.map((show, index) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-start gap-6">
                    <div className="px-4 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl backdrop-blur-xl border border-pink-500/30">
                      <p className="text-sm text-gray-400">
                        {new Date(show.date)
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .toUpperCase()}
                      </p>
                      <p className="text-3xl font-bold">
                        {new Date(show.date).getDate()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(show.date)
                          .toLocaleDateString("pt-BR", { month: "short" })
                          .toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold mb-2">{show.venue}</h3>
                      <div className="flex items-center gap-4 text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {show.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          22:00
                        </span>
                      </div>
                      <p className="text-sm text-purple-400">
                        Ingresso: {show.ticketNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {show.status === "confirmed" ? (
                      <>
                        <span className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            Confirmado
                          </span>
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                        >
                          Ver QR Code
                        </motion.button>
                      </>
                    ) : (
                      <span className="px-4 py-2 bg-gray-500/20 rounded-lg border border-gray-500/30 text-gray-400">
                        Show Realizado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Available Shows */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-400" />
          Próximos Shows
        </h2>

        <div className="grid gap-6">
          {availableShows.map((show, index) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{show.venue}</h3>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {show.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(show.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-pink-400">
                    {show.price}
                  </p>
                  {show.available ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold"
                    >
                      Comprar
                    </motion.button>
                  ) : (
                    <div className="px-6 py-3 bg-gray-800 rounded-xl font-bold text-gray-500">
                      Esgotado
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
