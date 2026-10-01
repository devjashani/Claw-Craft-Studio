import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        ash: "#111214",
        steel: "#C9CDD2",
        bone: "#F2F0EA",
        acid: "#B8FF1F",
        blood: "#E11D2E",
        dark: {
          900: "#08090A",
          800: "#0D0E11",
          700: "#17191E",
          600: "#22262E",
        },
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        gothic: ["var(--font-unifraktur)", "cursive"],
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        acid: "0 0 25px rgba(184, 255, 31, 0.25)",
        "acid-strong": "0 0 40px rgba(184, 255, 31, 0.45)",
        blood: "0 0 25px rgba(225, 29, 46, 0.35)",
        void: "0 20px 40px -15px rgba(0, 0, 0, 0.9)",
      },
      transitionTimingFunction: {
        claw: "cubic-bezier(0.16, 1, 0.3, 1)",
        mechanical: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glitch-shift": "glitch 2.5s infinite",
        marquee: "marquee 28s linear infinite",
        "marquee-reverse": "marquee 28s linear infinite reverse",
        "cart-shake": "cart-shake 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        "slash-flash": "slash-flash 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer-aluminum": "shimmer-aluminum 3.5s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        "cart-shake": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "15%": { transform: "scale(1.22) rotate(-14deg)" },
          "30%": { transform: "scale(1.18) rotate(14deg)" },
          "45%": { transform: "scale(1.12) rotate(-8deg)" },
          "60%": { transform: "scale(1.06) rotate(6deg)" },
          "75%": { transform: "scale(1.02) rotate(-2deg)" },
        },
        "slash-flash": {
          "0%": { opacity: "0", transform: "translateX(-100%) skewX(-30deg)" },
          "35%": { opacity: "0.85" },
          "100%": { opacity: "0", transform: "translateX(200%) skewX(-30deg)" },
        },
        "shimmer-aluminum": {
          "0%, 100%": { opacity: "0.15", transform: "translateX(-100%)" },
          "50%": { opacity: "0.55", transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
