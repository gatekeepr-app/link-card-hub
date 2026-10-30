// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const lovableConfig = defineConfig({
  // The Lovable wrapper pins its own Cloudflare target in Lovable builds;
  // outside Lovable, build the Nitro server for Vercel.
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

export default async (env: Parameters<typeof lovableConfig>[0]) => {
  const config = await lovableConfig(env);

  return {
    ...config,
    plugins: config.plugins?.filter(
      (plugin) =>
        !plugin ||
        Array.isArray(plugin) ||
        !("name" in plugin) ||
        plugin.name !== "vite-tsconfig-paths",
    ),
    resolve: {
      ...config.resolve,
      tsconfigPaths: true,
    },
  };
};
