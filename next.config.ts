/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false, // Temporariamente desabilitado para debug

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Configuração para permitir imagens externas
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Configurações webpack para resolver problemas com Immer/Zustand
  webpack: (
    config: import("webpack").Configuration,
    { isServer }: { isServer: boolean }
  ) => {
    // Resolver problemas com ESM modules
    if (!config.resolve) {
      config.resolve = {};
    }
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    
    // Configurar para melhor suporte ao exports field do package.json
    config.resolve.conditionNames = ['require', 'node', 'default'];
    config.resolve.mainFields = ['main', 'module'];
    config.resolve.exportsFields = ['exports'];

    // Configurações específicas para o cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Otimizações para Zustand e Immer com resolução específica de submodules
    config.resolve.alias = {
      ...config.resolve.alias,
      immer: require.resolve("immer"),
    };

    // Configurações para melhorar a compatibilidade
    if (!config.module) {
      config.module = { rules: [] };
    }
    if (!config.module.rules) {
      config.module.rules = [];
    }
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    // Fix para resolução de modules do Zustand
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    config.resolve.modules.push('node_modules');

    // Desabilitar barrel optimization para Zustand
    if (config.optimization && config.optimization.providedExports) {
      config.optimization.providedExports = false;
    }

    // Configurações específicas para lidar com problemas de submodule do Zustand
    if (!config.externals) {
      config.externals = [];
    }

    return config;
  },

  // Experimental features que podem ajudar
  experimental: {
    // Melhora o SSR com Zustand
    swcPlugins: [],
    // Otimizações de build
    optimizeCss: true,
    // Desabilitar otimizações que podem causar problemas com Zustand
    optimizePackageImports: ["framer-motion"],
  },

  // Configurações para melhorar a performance
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
