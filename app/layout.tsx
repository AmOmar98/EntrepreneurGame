import type { Metadata } from "next";
import { Baskervville, Montserrat } from "next/font/google";
import "./globals.css";
import "./eic-tokens.css";
import "./wf-components.css";

const baskervville = Baskervville({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

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
    <html className={`${baskervville.variable} ${montserrat.variable}`} lang="fr">
      <body>{children}</body>
    </html>
  );
}
