import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PinjeS - Sewa Barang Lokal",
    short_name: "PinjeS",
    description:
      "Sewa kamera, drone, tenda, konsol game, dan perlengkapan lain dari toko rental di sekitarmu.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f4ec",
    theme_color: "#f7f4ec",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
