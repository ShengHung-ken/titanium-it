import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    "https://titaniumit.rweb.site";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/login/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}