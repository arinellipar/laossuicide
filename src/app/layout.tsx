import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAOS - Last Attempt On Suicide",
  description: "Official website of LAOS band - Cyberpunk Music Experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
