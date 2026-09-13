import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movimento · Gestão de treino",
    short_name: "Movimento",
    description: "Acompanhamento de treino para academias, professores e alunos.",
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
