import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAMBER | Calzados y Bolsas",
  description: "Descubre bolsas y calzado RAMBER. Consulta modelos, descarga catálogos y solicita tu cotización por WhatsApp.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
