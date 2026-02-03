import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import mdx from "fumadocs-mdx/vite"
import { nitro } from "nitro/vite"
import { defineConfig, type Plugin } from "vite"
import { intlayer, intlayerProxy } from "vite-intlayer"
import viteTsConfigPaths from "vite-tsconfig-paths"
import * as MdxConfig from "./source.config"

function tanstackServerHMR(): Plugin {
  return {
    name: "tanstack-server-hmr",
    enforce: "post",
    handleHotUpdate(ctx) {
      if (ctx.file.includes("/routes/api/") || ctx.file.includes("/integrations/")) {
        ctx.server.restart()
      }
    },
  }
}

const config = defineConfig({
  optimizeDeps: {
    include: [
      "dotenv",
      "@radix-ui/react-tabs",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-popover",
    ],
  },
  plugins: [
    intlayerProxy(), // must be placed before nitro
    devtools(),
    nitro(),
    tanstackServerHMR(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
      sitemap: {
        enabled: true,
        host: process.env.VITE_APP_URL,
      },
    }),
    viteReact(),
    intlayer(),
    mdx(MdxConfig),
  ],
})

export default config
