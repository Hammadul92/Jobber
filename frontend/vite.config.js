import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/super-admin": { target: "http://app:8000", changeOrigin: false },
    },
  },
  build: {
    cssCodeSplit: true,
  },
  esbuild: {
    drop: command === "build" ? ["console", "debugger"] : [],
  },
}));
