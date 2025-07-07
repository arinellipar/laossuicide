"use client";

import { motion } from "framer-motion";
import {
  Music,
  Calendar,
  ShoppingBag,
  Newspaper,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total de Shows",
      value: "12",
      change: "+2 este mês",
      icon: Calendar,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Vendas do Mês",
      value: "R$ 45.2K",
      change: "+15% vs último mês",
      icon: DollarSign,
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      title: "Novos Fãs",
      value: "1,234",
      change: "+8% esta semana",
      icon: Users,
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      title: "Engajamento",
      value: "87%",
      change: "+12 pontos",
      icon: Activity,
      gradient: "from-pink-500 to-purple-500",
    },
  ];

  const recentActivities = [
    {
      type: "show",
      text: "Novo show agendado em São Paulo",
      time: "2 horas atrás",
    },
    {
      type: "merch",
      text: "50 camisetas vendidas hoje",
      time: "5 horas atrás",
    },
    {
      type: "music",
      text: "Nova música alcançou 10K plays",
      time: "1 dia atrás",
    },
    {
      type: "news",
      text: "Artigo publicado sobre a banda",
      time: "2 dias atrás",
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
            BEM-VINDO AO CENTRO DE COMANDO
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Gerencie o Império Cyberpunk da LAOS
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>

              <h3 className="text-gray-400 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-sm text-green-400">{stat.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 text-white">Ações Rápidas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Music,
              label: "Nova Música",
              color: "from-pink-500 to-rose-500",
            },
            {
              icon: Calendar,
              label: "Agendar Show",
              color: "from-purple-500 to-indigo-500",
            },
            {
              icon: ShoppingBag,
              label: "Add Produto",
              color: "from-cyan-500 to-blue-500",
            },
            {
              icon: Newspaper,
              label: "Nova Notícia",
              color: "from-green-500 to-emerald-500",
            },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${action.color} rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity`}
              />

              <div className="relative bg-black/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 flex flex-col items-center gap-3 hover:border-pink-500/50 transition-colors">
                <action.icon className="w-8 h-8 text-white" />
                <span className="font-semibold text-white">{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 text-white">
          Atividade Recente
        </h2>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-4 border-b border-purple-500/20 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                  <p className="text-gray-300">{activity.text}</p>
                </div>
                <span className="text-gray-500 text-sm">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 text-white">Performance</h2>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
            <p className="text-gray-400 text-lg">
              Gráficos de performance em breve
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
