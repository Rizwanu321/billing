/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-in",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
  safelist: [
    "text-green-600",
    "text-red-600",
    "text-blue-600",
    "text-orange-600",
    "text-purple-600",
    "text-yellow-600",
    "bg-green-50",
    "bg-red-50",
    "bg-blue-50",
    "bg-orange-50",
    "bg-purple-50",
    "bg-yellow-50",
    "border-green-500",
    "border-red-500",
    "border-blue-500",
    "border-orange-500",
    "border-purple-500",
    "border-yellow-500",
  ],
};
