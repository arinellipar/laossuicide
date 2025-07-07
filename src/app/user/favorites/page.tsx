"use client";

import { motion } from "framer-motion";
import { Heart, Music, Play, Clock, Disc3 } from "lucide-react";
import Image from "next/image";

export default function UserFavoritesPage() {
  const favoriteSongs = [
    {
      id: 1,
      title: "Broken Mirrors",
      album: "Cyber Rebellion",
      duration: "3:45",
      plays: 342,
    },
    {
      id: 2,
      title: "Neon Shadows",
      album: "Neon Dreams",
      duration: "4:12",
      plays: 287,
    },
    {
      id: 3,
      title: "Digital Void",
      album: "Digital Void",
      duration: "3:58",
      plays: 198,
    },
    {
      id: 4,
      title: "Last Breath",
      album: "Cyber Rebellion",
      duration: "5:21",
      plays: 156,
    },
  ];

  const favoriteAlbums = [
    {
      id: 1,
      title: "Cyber Rebellion",
      year: 2024,
      image:
        "https://images.unsplash.com/photo-1598387993441-a364f854e29d?w=400&h=400&fit=crop",
      tracks: 12,
    },
    {
      id: 2,
      title: "Neon Dreams",
      year: 2023,
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      tracks: 10,
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
            MEUS FAVORITOS
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Suas músicas e álbuns favoritos do LAOS
        </p>
      </motion.div>

      {/* Favorite Songs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Music className="w-8 h-8 text-pink-400" />
          Músicas Favoritas
        </h2>

        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="p-6 space-y-4">
            {favoriteSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

                <div className="relative bg-black/30 backdrop-blur rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-shadow"
                    >
                      <Play className="w-5 h-5 text-white" />
                    </motion.button>

                    <div>
                      <h3 className="font-bold text-lg group-hover:text-pink-400 transition-colors">
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-400">{song.album}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {song.plays} plays
                      </p>
                      <p className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {song.duration}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-pink-400"
                    >
                      <Heart className="w-6 h-6 fill-current" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Favorite Albums */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Disc3 className="w-8 h-8 text-purple-400" />
          Álbuns Favoritos
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {favoriteAlbums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="group relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30">
                <div className="flex">
                  <div className="relative w-48 h-48">
                    <Image
                      src={album.image}
                      alt={album.title}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50" />
                  </div>

                  <div className="flex-1 p-6">
                    <h3 className="text-2xl font-bold mb-2">{album.title}</h3>
                    <p className="text-gray-400 mb-4">
                      {album.year} • {album.tracks} faixas
                    </p>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold text-sm"
                      >
                        Ouvir Agora
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-colors font-semibold text-sm"
                      >
                        Ver Faixas
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-xl border border-purple-500/30"
      >
        <h3 className="text-2xl font-bold mb-6">Suas Estatísticas</h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-pink-400 mb-2">24</p>
            <p className="text-gray-400">Músicas Favoritas</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-400 mb-2">127h</p>
            <p className="text-gray-400">Tempo de Reprodução</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-cyan-400 mb-2">3.4K</p>
            <p className="text-gray-400">Reproduções Totais</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
