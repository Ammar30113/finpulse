import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcdfff",
          300: "#8ecbff",
          400: "#59adff",
          500: "#338bff",
          600: "#1a6af5",
          700: "#1355e1",
          800: "#1645b6",
          900: "#183d8f",
          950: "#132757",
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
