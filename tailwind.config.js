/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff4ff",
          100: "#dbe8ff",
          200: "#bfd5ff",
          300: "#93b8ff",
          400: "#608eff",
          500: "#3b67ff",
          600: "#1a44f5",
          700: "#1330e1",
          800: "#1628b5",
          900: "#17278e",
          950: "#111856"
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669"
        },
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7"
        },
        plate: {
          yellow: "#fbbf24",
          "yellow-dark": "#f59e0b"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.05)",
        sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        lg: "0 10px 30px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)",
        xl: "0 20px 50px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.05)",
        card: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07)",
        "card-hover": "0 0 0 1px rgba(99,102,241,0.15), 0 8px 24px rgba(99,102,241,0.12)",
        brand: "0 8px 24px rgba(79,70,229,0.25), 0 2px 6px rgba(79,70,229,0.15)",
        "brand-sm": "0 4px 12px rgba(79,70,229,0.2)"
      },
      backgroundImage: {
        "hero-mesh": "radial-gradient(ellipse 95% 70% at 60% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 0% 60%, rgba(14,165,233,0.06) 0%, transparent 55%)",
        "brand-grad": "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        "cta-grad": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #0ea5e9 100%)"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" }
        }
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "scale-in": "scaleIn 0.35s ease-out both",
        shimmer: "shimmer 1.8s linear infinite",
        float: "float 3.5s ease-in-out infinite",
        spin: "spin 1s linear infinite"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};
