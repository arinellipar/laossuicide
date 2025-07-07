"use client";

import { motion } from "framer-motion";
import { Music, Play, Heart, Share2 } from "lucide-react";
import Image from "next/image";

export default function UserMusicPage() {
  const albums = [
    {
      id: 1,
      title: "Cyber Rebellion",
      year: 2024,
      image:
        "https://images.unsplash.com/photo-1598387993441-a364f854e29d?w=400&h=400&fit=crop",
      tracks: [
        { title: "Broken Mirrors", duration: "3:45" },
        { title: "Electric Dreams", duration: "4:21" },
        { title: "Neon Blood", duration: "3:58" },
        { title: "System Override", duration: "5:12" },
      ],
    },
    {
      id: 2,
      title: "Neon Dreams",
      year: 2023,
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      tracks: [
        { title: "Neon Shadows", duration: "4:12" },
        { title: "Digital Heart", duration: "3:36" },
        { title: "Synthetic Love", duration: "4:45" },
        { title: "Chrome Sky", duration: "3:28" },
      ],
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
            DISCOGRAFIA
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Explore toda a coleção musical do LAOS
        </p>
      </motion.div>

      {/* Albums Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {albums.map((album, albumIndex) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: albumIndex * 0.2 }}
            className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 h-64 relative">
                <Image
                  src={album.image}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              <div className="flex-1 p-6">
                <h2 className="text-3xl font-bold mb-2">{album.title}</h2>
                <p className="text-gray-400 mb-4">{album.year}</p>

                <div className="flex gap-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Ouvir Álbum
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30"
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-2">
                  {album.tracks.map((track, trackIndex) => (
                    <motion.div
                      key={trackIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: albumIndex * 0.2 + trackIndex * 0.05,
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-500/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-6">
                          {trackIndex + 1}
                        </span>
                        <p className="font-medium group-hover:text-pink-400 transition-colors">
                          {track.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">
                          {track.duration}
                        </span>
                        <Play className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Singles Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Music className="w-8 h-8 text-pink-400" />
          Singles & EPs
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Digital Void", year: 2024, type: "Single" },
            { title: "Neon Nights EP", year: 2023, type: "EP" },
            { title: "Last Breath", year: 2023, type: "Single" },
          ].map((single, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 text-center"
            >
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <Music className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">{single.title}</h3>
              <p className="text-gray-400 text-sm mb-4">
                {single.type} • {single.year}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold text-sm w-full"
              >
                Ouvir Agora
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
