import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "AI Product Listing Generator — Photo to Instant Listing",
  description: "Upload a product photo and generate a ready-to-post marketplace listing in seconds.",
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/assets/logo.svg"],
    apple: [{ url: "/logo.png" }],
  },
  openGraph: {
    title: "AI Product Listing Generator — Photo to Instant Listing",
    description: "Upload a product photo and generate a ready-to-post marketplace listing in seconds.",
    images: [{ url: "/assets/logo.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
