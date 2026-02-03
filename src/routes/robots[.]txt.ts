import { createFileRoute } from "@tanstack/react-router"
import { robotsConfig } from "@/config/robots-config"

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const disallowLines = robotsConfig.rules.disallow
          .map((path) => `Disallow: ${path}`)
          .join("\n")

        const robots = [
          `User-agent: ${robotsConfig.rules.userAgent}`,
          `Allow: ${robotsConfig.rules.allow}`,
          disallowLines,
          "",
          `Sitemap: ${robotsConfig.sitemap}`,
        ].join("\n")

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain",
          },
        })
      },
    },
  },
})
