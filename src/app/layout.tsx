import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "PersoNutri",
  description: "App de nutrição e treino para hipertrofia muscular",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body style={{ background: "#111", minHeight: "100dvh" }}>
        <div style={{ maxWidth: 390, margin: "0 auto", minHeight: "100dvh", background: "#F7F7F7" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
