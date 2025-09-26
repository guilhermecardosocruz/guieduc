import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GUIEDUC",
  description: "Acesso e gerenciamento educacional",
  openGraph: { title: "GUIEDUC", type: "website" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
