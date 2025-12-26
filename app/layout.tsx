import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cache busting version - increment this when favicons change
const FAVICON_VERSION = "3";

export const metadata: Metadata = {
  title: "Order Management",
  description: "Manage your orders with Firebase",
  icons: {
    icon: [
      { url: `/favicon-16x16.png?v=${FAVICON_VERSION}`, sizes: "16x16", type: "image/png" },
      { url: `/favicon-32x32.png?v=${FAVICON_VERSION}`, sizes: "32x32", type: "image/png" },
      { url: `/favicon.ico?v=${FAVICON_VERSION}`, sizes: "any" },
    ],
    apple: [
      { url: `/apple-touch-icon.png?v=${FAVICON_VERSION}`, sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: `/android-chrome-192x192.png?v=${FAVICON_VERSION}`,
      },
      {
        rel: "android-chrome-512x512",
        url: `/android-chrome-512x512.png?v=${FAVICON_VERSION}`,
      },
    ],
  },
  manifest: `/site.webmanifest?v=${FAVICON_VERSION}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
