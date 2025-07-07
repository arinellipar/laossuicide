"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Newspaper,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
} from "lucide-react";

export default function NoticiasPage() {
  const articles = [
    {
      id: 1,
      title: "LAOS anuncia nova turnê 'Cyber Rebellion'",
      excerpt:
        "A banda revelou as datas da aguardada turnê que passará por 10 cidades brasileiras...",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      date: "2025-07-01",
      views: 1234,
      likes: 342,
      comments: 56,
      status: "published",
    },
    {
      id: 2,
      title: "Novo single 'Digital Void' alcança 1M de plays",
      excerpt:
        "O mais recente lançamento da banda ultrapassou a marca de um milhão de reproduções...",
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop",
      date: "2025-06-28",
      views: 2341,
      likes: 567,
      comments: 89,
      status: "published",
    },
    {
      id: 3,
      title: "Bastidores do novo videoclipe",
      excerpt:
        "Confira imagens exclusivas das gravações do clipe de 'Neon Dreams'...",
      image:
        "https://images.unsplash.com/photo-1565035010268-a3816f98589a?w=800&h=400&fit=crop",
      date: "2025-06-25",
      views: 876,
      likes: 234,
      comments: 34,
      status: "draft",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "published") {
      return (
        <span className="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 rounded-full text-sm font-semibold">
          Publicado
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-full text-sm font-semibold">
        Rascunho
      </span>
    );
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
            NOTÍCIAS & UPDATES
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Gerencie as novidades e comunicados da banda
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total de Posts", value: "124", icon: Newspaper },
          { label: "Visualizações", value: "45.2K", icon: Eye },
          { label: "Engajamento", value: "89%", icon: TrendingUp },
          { label: "Comentários", value: "1.2K", icon: MessageCircle },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <stat.icon className="w-8 h-8 text-pink-400 mb-3" />
              <h3 className="text-gray-400 text-sm mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Article Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2"
        style={{
          boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
        }}
      >
        <Plus className="w-5 h-5" />
        Nova Notícia
      </motion.button>

      {/* Articles Grid */}
      <div className="grid gap-6">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30">
              <div className="flex flex-col md:flex-row">
                {/* Article Image */}
                <div className="md:w-80 h-48 md:h-auto relative overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={320}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50" />
                </div>

                {/* Article Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-pink-400 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 mb-4">{article.excerpt}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(article.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{article.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{article.comments}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3 ml-4">
                      {getStatusBadge(article.status)}

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-purple-400" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-500/30 hover:border-red-400/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
