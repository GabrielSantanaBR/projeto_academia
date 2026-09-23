import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movimento · Academia conectada",
    short_name: "Movimento",
    description: "Treinos, corridas, comunidade e nutrição para sua academia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f6",
    theme_color: "#c84411",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
