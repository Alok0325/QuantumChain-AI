/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette used across the Phase 1-9 pages.
        qc: {
          bg:    "#0b1018",
          card:  "rgba(255,255,255,0.04)",
          border:"rgba(255,255,255,0.08)",
          fg:    "#e8ecf3",
          muted: "#b0b8ca",
          muted2:"#8a93a6",
          cyan:  "#6ee7ff",
          purple:"#b884ff",
          green: "#34d399",
          amber: "#fcd34d",
          rose:  "#fb7185",
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },
      keyframes: {
        pulseDot: {
          "0%":   { boxShadow: "0 0 0 0 rgba(52,211,153,0.5)" },
          "70%":  { boxShadow: "0 0 0 8px rgba(52,211,153,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(52,211,153,0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-dot": "pulseDot 2s infinite",
        "shimmer":   "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};
