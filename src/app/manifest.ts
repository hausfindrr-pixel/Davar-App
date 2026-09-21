import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Davar — Daily Discipleship",
    short_name: "Davar",
    description:
      "A daily discipleship app: gamified scripture engagement with streaks and lightweight accountability.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#b9794a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
