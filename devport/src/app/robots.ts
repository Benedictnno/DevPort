import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://devport.local";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects/*"],
        disallow: ["/dashboard/*", "/api/*", "/_next/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
