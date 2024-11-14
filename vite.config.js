import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    proxy: {
      "/api": "https://chatbot-nodejs-lsjx.onrender.com",
    },
  },
  plugins: [react()],
});
