import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VYNS - Yield Name Service | Premium Web3 Identity That Earns",
  description:
    "The first universal name service with built-in yield generation. Own your @username as an on-chain asset. Earn from transactions, staking, and marketplace fees. Cross-chain, permanent ownership.",
  keywords: [
    "VYNS",
    "Vincu Yield Name Service",
    "Web3 Identity",
    "DeFi Names",
    "Yield Generating NFT",
    "Solana Names",
    "Cross-chain Identity",
    "On-chain Username",
    "Crypto Username",
    "Name Service",
    "Passive Income",
    "Staking Rewards",
  ],
  authors: [{ name: "VYNS Protocol" }],
  creator: "VYNS Protocol",
  publisher: "VYNS Protocol",
  metadataBase: new URL("https://vyns.io"), // Replace with your actual domain
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vyns.io",
    siteName: "VYNS - Yield Name Service",
    title: "VYNS - Your Name. Your Yield. On-Chain.",
    description:
      "Premium Web3 identity that generates passive income. Own your @username forever and earn from every transaction.",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "VYNS - Yield Name Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VYNS - Yield Name Service",
    description:
      "Premium Web3 identity that generates passive income. Own your @username forever.",
    images: ["/preview.png"],
    creator: "@vyns_protocol", // Replace with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#030811" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
