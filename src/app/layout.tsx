import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-surface">
        <div className="mobile-frame">{children}</div>
      </body>
    </html>
  );
}
