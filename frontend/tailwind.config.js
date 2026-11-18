/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desk: "#F0EDE8",
        page: "#FFFFFF",
        "page-shade": "#F8F7F5",
        ink: {
          DEFAULT: "#0B0B10",
          2: "#4B4B57",
          3: "#8A8A96",
        },
        rule: "#E3E1E0",
        lime: {
          DEFAULT: "#D4F73C",
          strong: "#BCE814",
          soft: "#F4FCE3",
        },
        // Non-blue semantic palette
        risk: {
          up: "#E11D48",       // Coral Crimson
          down: "#059669",     // Forest Emerald
          calibrated: "#65A30D"// Warm Olive
        },
        state: {
          success: "#059669",
          warning: "#D97706",
          danger: "#E11D48",
          teal: "#0D9488",
          purple: "#7C3AED",
          amber: "#F59E0B"
        }
      },
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Albert Sans", "system-ui", "sans-serif"],
        mono: ["Martian Mono", "Courier New", "monospace"]
      },
      boxShadow: {
        book: "0 25px 50px -12px rgba(11, 11, 16, 0.12), 0 0 0 1px rgba(11, 11, 16, 0.05)",
        page: "0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 0 1px 1px rgba(0,0,0,0.03)",
        gutter: "inset 18px 0 25px -10px rgba(0, 0, 0, 0.07), inset -18px 0 25px -10px rgba(0, 0, 0, 0.07)"
      }
    },
  },
  plugins: [],
}
