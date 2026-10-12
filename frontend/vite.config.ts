import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      ignored: ["**/mobile/**", "**/src/Perry.*/**", "**/project_defense/**"],
    },
    proxy: {
      // Auth Service (Azure) — same-origin, иначе браузер режет CORS с localhost
      "/auth-api": {
        target:
          "https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth-api/, ""),
      },
      // Admin Users (perry-admin-service) — не путать с Auth /internal/users
      "/users-api": {
        target:
          "https://perry-admin-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/users-api/, ""),
      },
      "/api": {
        target: "http://localhost:5272",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5272",
        changeOrigin: true,
      },
    },
  },
});
