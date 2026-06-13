import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/qdialer/app/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "../../www/qdialer/app",
    emptyOutDir: true
  }
});
