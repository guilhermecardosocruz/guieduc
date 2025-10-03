import "./../styles/globals.css";
import type { Metadata, Viewport } from "next";
import VersionGuard from "@/components/VersionGuard";

export const metadata: Metadata = {
  title: "GUIEDUC",
  description: "Acesso e gerenciamento educacional",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GUIEDUC"
  },
  openGraph: { title: "GUIEDUC", type: "website" }
};

export const viewport: Viewport = {
  themeColor: "#0A66FF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <VersionGuard />
        {children}
      </body>
    </html>
  );
}
