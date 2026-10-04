import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doon Pickleball Academy",
    short_name: "Doon Pickleball",
    description: "Court bookings and membership at Doon Pickleball Academy, GMS Road, Dehradun.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#075bea",
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
