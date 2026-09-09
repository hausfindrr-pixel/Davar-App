import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Davar — Daily Discipleship",
    short_name: "Davar",
    description:
      "A daily discipleship app: gamified scripture engagement with streaks, XP, and lightweight accountability.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f23",
    theme_color: "#4f46e5",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
