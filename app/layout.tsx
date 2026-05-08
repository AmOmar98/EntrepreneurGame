import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EIC Venture Journey",
  description: "Pilot dashboard for founders, reviewers, and EIC staff.",
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
