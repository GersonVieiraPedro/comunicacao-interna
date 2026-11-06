import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Barlow } from "next/font/google";
import { appConfig } from "@/config/app";
// @ts-ignore -- Next.js resolves global CSS imports during the build.
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--sf-font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: "Central de Comunicação Interna — Meta RH",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Central", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#470082",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={barlow.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning >
        {children}
      </body>
    </html>
  );
}
