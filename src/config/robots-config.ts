export const robotsConfig = {
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: ["/*?*q=", "/admin/*", "/api/*"],
  },
  sitemap: `${import.meta.env.VITE_APP_URL}/sitemap.xml`,
}
