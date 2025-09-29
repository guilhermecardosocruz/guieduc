import "./../styles/globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "GUIEDUC",
  description: "Acesso e gerenciamento educacional",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/maskable-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/maskable-512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    other: [{ rel: "mask-icon", url: "/icons/maskable-512.svg" }]
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GUIEDUC" },
  openGraph: { title: "GUIEDUC", type: "website" }
};

export const viewport: Viewport = { themeColor: "#0A66FF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
