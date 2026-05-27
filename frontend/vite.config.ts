// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Disable the Cloudflare adapter and build as a static SPA so the output (dist/client)
// can be served by any static host (Vercel). All backend work lives in Supabase, so
// SSR isn't needed for this app.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
  },
});
