import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Davar — Daily Discipleship",
    short_name: "Davar",
    description:
      "A daily discipleship app: gamified scripture engagement with streaks, XP, and lightweight accountability.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#b9794a",
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
