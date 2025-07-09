"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

export default function ShowsPage() {
  const shows = [
    {
      id: 1,
      date: "2025-07-15",
      time: "22:00",
      venue: "The Vortex Club",
      city: "São Paulo",
      capacity: 500,
      soldTickets: 342,
      status: "confirmed",
    },
    {
      id: 2,
      date: "2025-07-22",
      time: "21:00",
      venue: "Underground Arena",
      city: "Rio de Janeiro",
      capacity: 800,
      soldTickets: 567,
      status: "confirmed",
    },
    {
      id: 3,
      date: "2025-08-05",
      time: "23:00",
      venue: "Dark Matter",
      city: "Belo Horizonte",
      capacity: 400,
      soldTickets: 400,
      status: "soldout",
    },
    {
      id: 4,
      date: "2025-08-20",
      time: "22:30",
      venue: "Neon Dreams",
      city: "Porto Alegre",
      capacity: 600,
      soldTickets: 234,
      status: "pending",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-400/10 border-green-400/30";
      case "soldout":
        return "text-pink-400 bg-pink-400/10 border-pink-400/30";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "soldout":
        return "Esgotado";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            SHOWS & TOURS
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Gerencie a agenda de apresentações da banda
        </p>
      </motion.div>

      {/* Add Show Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2"
        style={{
          boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
        }}
      >
        <Plus className="w-5 h-5" />
        Agendar Novo Show
      </motion.button>

      {/* Shows List */}
      <div className="space-y-6">
        {shows.map((show, index) => (
          <motion.div
            key={show.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Show Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{show.venue}</h3>
                      <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          <span>{show.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>
                            {new Date(show.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span>{show.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                        show.status
                      )}`}
                    >
                      {getStatusText(show.status)}
                    </span>
                  </div>

                  {/* Ticket Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Ingressos vendidos</span>
                      <span className="font-semibold">
                        {show.soldTickets} / {show.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(show.soldTickets / show.capacity) * 100}%`,
                        }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400">
                        {Math.round((show.soldTickets / show.capacity) * 100)}%
                        de ocupação
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-xl bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-purple-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-xl bg-red-500/20 backdrop-blur-xl border border-red-500/30 hover:border-red-400/50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calendar View Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <button className="px-6 py-3 border border-purple-500/50 rounded-xl font-semibold hover:bg-purple-500/10 transition-colors">
          Ver Calendário Completo
        </button>
      </motion.div>
    </div>
  );
}
