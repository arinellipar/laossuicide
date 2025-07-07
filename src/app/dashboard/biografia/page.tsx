"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function BiografiaPage() {
  const members = [
    {
      name: "Mitsuo Awada",
      role: "Vocalista / Guitarrista",
      bio: "Fundador da banda, Alex traz a energia cyberpunk com vocais poderosos e riffs futuristas.",
      image:
        "https://images.unsplash.com/photo-1540569014015-19a7be504e3b?w=400&h=400&fit=crop",
      social: "@alexstorm",
    },
    {
      name: "Koy Void",
      role: "Baixista / Backing Vocal",
      bio: "Com grooves pesados e linhas melódicas únicas, Luna é o coração pulsante da banda.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      social: "@lunaneon",
    },
    {
      name: "Kai Binary",
      role: "Baterista",
      bio: "Precisão mecânica com alma humana, Kai define o ritmo frenético do LAOS.",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
      social: "@kaibinary",
    },
    {
      name: "Nova Synth",
      role: "Sintetizadores / Programação",
      bio: "Mestre dos sons eletrônicos, Nova cria as paisagens sonoras futuristas da banda.",
      image:
        "https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=400&h=400&fit=crop",
      social: "@novasynth",
    },
  ];

  const timeline = [
    { year: "2023", event: "Formação da banda em Rio de Janeiro" },
    { year: "2023", event: "Primeiro show no Underground Club" },
    { year: "2024", event: "Lançamento do álbum 'Cyber Rebellion'" },
    { year: "2024", event: "Tour nacional 'Neon Dreams'" },
    { year: "2025", event: "Festival Rock in Rio" },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-20"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-8 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
            A HISTÓRIA DO LAOS
          </span>
        </h1>

        <div className="relative rounded-3xl overflow-hidden mb-12">
          <Image
            src="https://images.unsplash.com/photo-1598387993441-a364f854e29d?w=1200&h=600&fit=crop"
            alt="LAOS Band"
            width={1200}
            height={600}
            className="w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl">
              Nascidos das sombras neon de São Paulo, LAOS é mais que uma banda
              - é uma revolução sonora que desafia os limites entre o humano e o
              digital.
            </p>
          </div>
        </div>

        {/* Band Story */}
        <div className="prose prose-invert max-w-none">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-xl border border-purple-500/30 mb-12"
          >
            <h2 className="text-3xl font-bold mb-6 text-white">
              Nossa Jornada
            </h2>
            <p className="text-gray-300 mb-4 text-lg">
              LAOS (Last Attempt On Suicide) surgiu em 2023 como uma resposta
              artística à desconexão digital da sociedade moderna. Combinando
              elementos de synthwave, cyberpunk e rock alternativo, criamos uma
              experiência sonora única que questiona nossa relação com a
              tecnologia e a humanidade.
            </p>
            <p className="text-gray-300 text-lg">
              Cada performance é uma imersão total em um futuro distópico onde a
              música é a última forma de resistência. Com visuais holográficos,
              sintetizadores analógicos e uma energia crua no palco,
              transformamos cada show em uma experiência transcendental.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Band Members */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="max-w-6xl mx-auto mb-20"
      >
        <h2 className="text-4xl md:text-5xl font-black mb-12 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            OS CYBERPUNKS
          </span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {members.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 overflow-hidden">
                <div className="flex gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-xl overflow-hidden">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-50 -z-10" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                    <p className="text-pink-400 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-400 mb-3">{member.bio}</p>
                    <p className="text-sm text-purple-400">{member.social}</p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-transparent rounded-bl-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-black mb-12 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            LINHA DO TEMPO
          </span>
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-pink-500 via-purple-500 to-pink-500" />

          {timeline.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center mb-8"
            >
              {/* Timeline dot */}
              <div className="absolute left-6 w-4 h-4 bg-pink-500 rounded-full border-4 border-black">
                <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping" />
              </div>

              {/* Content */}
              <div className="ml-16 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-6 backdrop-blur-xl border border-purple-500/30">
                <p className="text-2xl font-bold text-pink-400 mb-2">
                  {item.year}
                </p>
                <p className="text-gray-300">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
