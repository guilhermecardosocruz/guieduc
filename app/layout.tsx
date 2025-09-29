import "./../styles/globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "GUIEDUC",
  description: "Acesso e gerenciamento educacional",
  applicationName: "GUIEDUC",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GUIEDUC" },
  openGraph: { title: "GUIEDUC", type: "website" }
};

export const viewport: Viewport = {
  themeColor: "#0A66FF" // moveu themeColor para viewport (Next 15)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="bg-white">
      <head>
        {/* força claro antes do CSS carregar */}
        <meta name="color-scheme" content="light" />
        <style
          // crítico: evita tela escura na primeira pintura
          dangerouslySetInnerHTML={{ __html: "html,body{background:#fff;}" }}
        />
      </head>
      <body className="min-h-dvh bg-white" style={{ backgroundColor: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
