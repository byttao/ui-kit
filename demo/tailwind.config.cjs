/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../components/**/*.{ts,tsx}"],
};
