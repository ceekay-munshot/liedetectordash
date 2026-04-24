import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Walk the Talk Dashboard",
  description:
    "Track, score, and verify management promises vs. outcomes for listed companies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://rsms.me/"
        />
        <link
          rel="stylesheet"
          href="https://rsms.me/inter/inter.css"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
