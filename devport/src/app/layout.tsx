import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://devport.local"),
  title: {
    default: "DevPort — Developer Infrastructure & Project Intelligence",
    template: "%s | DevPort",
  },
  description:
    "DevPort connects your GitHub, Vercel, and OpenAPI sources into a structured project profile you can manage and expose through an API.",
  keywords: ["developer portfolio", "project management", "GitHub", "API", "project intelligence", "infrastructure"],
  authors: [{ name: "DevPort Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "DevPort",
    title: "DevPort — Developer Infrastructure & Project Intelligence",
    description:
      "DevPort connects your GitHub, Vercel, and OpenAPI sources into a structured project profile you can manage and expose through an API.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevPort — Developer Infrastructure & Project Intelligence",
    description:
      "DevPort connects your GitHub, Vercel, and OpenAPI sources into a structured project profile you can manage and expose through an API.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("dark", inter.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container"
      >
        {children}
      </body>
    </html>
  );
}
