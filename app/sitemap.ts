import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "http://localhost:3000";

  return [
    { url: `${baseUrl}/`, priority: 1 },
    { url: `${baseUrl}/app`, priority: 0.8 },
    { url: `${baseUrl}/admin`, priority: 0.8 },
  ];
}
