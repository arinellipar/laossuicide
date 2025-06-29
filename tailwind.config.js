/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // adicional caso use src
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cores principais da banda
        "laos-pink": {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899", // cor principal
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
          950: "#500724",
        },
        "laos-purple": {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7", // cor principal
          600: "#9333ea",
          700: "#7c3aed",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 3s linear infinite",
        "spin-slow": "spin 10s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        glitch: "glitch 0.5s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%) skewX(-12deg)" },
          "100%": { transform: "translateX(200%) skewX(-12deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grid-pattern": `linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)`,
      },
      boxShadow: {
        "glow-pink": "0 0 40px rgba(236, 72, 153, 0.5)",
        "glow-purple": "0 0 40px rgba(168, 85, 247, 0.5)",
        "glow-intense":
          "0 0 80px rgba(236, 72, 153, 0.6), 0 0 120px rgba(168, 85, 247, 0.4)",
        "inner-glow": "inset 0 0 30px rgba(255, 255, 255, 0.2)",
        holographic:
          "0 0 50px rgba(236, 72, 153, 0.3), inset 0 0 30px rgba(168, 85, 247, 0.1)",
      },
      blur: {
        "4xl": "100px",
        "5xl": "150px",
        "6xl": "200px",
      },
      dropShadow: {
        "glow-pink": "0 0 20px rgba(236, 72, 153, 0.8)",
        "glow-purple": "0 0 20px rgba(168, 85, 247, 0.8)",
        "glow-text": "0 0 30px rgba(236, 72, 153, 0.5)",
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      perspective: {
        1000: "1000px",
        2000: "2000px",
      },
      transitionDelay: {
        2000: "2000ms",
        3000: "3000ms",
        4000: "4000ms",
        5000: "5000ms",
      },
      backgroundSize: {
        "size-200": "200% 200%",
      },
      backdropBlur: {
        "4xl": "100px",
      },
    },
  },
  plugins: [
    // Plugin para perspective
    function ({ addUtilities }) {
      const newUtilities = {
        ".perspective-1000": {
          perspective: "1000px",
        },
        ".perspective-2000": {
          perspective: "2000px",
        },
        ".transform-gpu": {
          transform: "translateZ(0)",
        },
        ".backface-hidden": {
          backfaceVisibility: "hidden",
        },
        ".preserve-3d": {
          transformStyle: "preserve-3d",
        },
        // Utilitários para text shadows customizados
        ".text-shadow-glow": {
          textShadow:
            "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)",
        },
        ".text-shadow-neon": {
          textShadow:
            "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
        },
        // Animação de delay customizada
        ".animation-delay-100": {
          animationDelay: "100ms",
        },
        ".animation-delay-200": {
          animationDelay: "200ms",
        },
        ".animation-delay-300": {
          animationDelay: "300ms",
        },
        ".animation-delay-400": {
          animationDelay: "400ms",
        },
        ".animation-delay-500": {
          animationDelay: "500ms",
        },
        ".animation-delay-1000": {
          animationDelay: "1000ms",
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
