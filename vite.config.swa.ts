// Static build config for Azure Static Web Apps.
// Produces a fully static SPA (no Node server): the app shell is prerendered
// to /index.html and all routes render client-side. The regular vite.config.ts
// (SSR, node-server preset) remains the build for Azure App Service.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Same custom server entry as vite.config.ts — still used during the
    // shell prerender step.
    server: { entry: "server" },
    spa: {
      enabled: true,
    },
  },
  // Nitro must be off here: the SPA-shell prerender step serves the app from
  // TanStack Start's own output layout (dist/server/server.js), which nitro
  // presets replace. Without nitro the build lands in dist/ and the deployable
  // static site is dist/client.
  nitro: false,
});
