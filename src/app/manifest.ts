import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MUVIONT Cinematic Streaming Platform",
    short_name: "MUVIONT",
    description: "Next-generation luxury cinematic streaming platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#FF0000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.jpg",
        sizes: "any",
        type: "image/jpeg",
        purpose: "any"
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
