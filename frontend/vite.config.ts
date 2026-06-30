import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@css": path.resolve(__dirname, "src/css"),
      "@images": path.resolve(__dirname, "src/images"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
