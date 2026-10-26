import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agendinha",
    short_name: "Agendinha",
    description: "Gerencie seus horários e agendamentos em um só lugar.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    background_color: "#f3f7f7",
    theme_color: "#0a5558",
    lang: "pt-BR",
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
    shortcuts: [
      {
        name: "Novo horário",
        short_name: "Novo",
        url: "/inicio/horarios/criar",
      },
      {
        name: "Agendamentos",
        url: "/inicio/agendamentos",
      },
    ],
  };
}
