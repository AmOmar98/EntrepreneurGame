import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Entrepreneur Game - EIC / UEMF", template: "%s - Entrepreneur Game" },
  description: "Plateforme d'accompagnement entrepreneurial gamifiee EIC / UEMF.",
  icons: { icon: "/brand/logo-eic.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
