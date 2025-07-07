import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAOS - Last Attempt On Suicide",
  description: "Official website of LAOS band - Cyberpunk Music Experience",
  keywords: "LAOS, cyberpunk, music, band, synthwave, darkwave, São Paulo",
  authors: [{ name: "LAOS Band" }],
  creator: "LAOS",
  publisher: "LAOS",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://laosband.com",
    siteName: "LAOS",
    title: "LAOS - Last Attempt On Suicide",
    description: "Official website of LAOS band - Cyberpunk Music Experience",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LAOS Band",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LAOS - Last Attempt On Suicide",
    description: "Official website of LAOS band - Cyberpunk Music Experience",
    images: ["/twitter-image.jpg"],
    creator: "@laosband",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// Viewport configuration separated according to Next.js 14+ architecture
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" },
    { media: "(prefers-color-scheme: dark)", color: "#a855f7" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
