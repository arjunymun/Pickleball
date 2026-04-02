import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sideout",
    short_name: "Sideout",
    description: "A premium Dehradun pickleball club app for bookings, packs, memberships, and repeat-play value.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f4efe7",
    theme_color: "#1f6a54",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
