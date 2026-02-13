import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Econvery — Discover Research That Matters",
  description:
    "Personalized academic paper discovery for economics and political science researchers. Find relevant papers from top journals based on your research interests.",
  keywords: [
    "academic papers",
    "economics research",
    "political science",
    "paper discovery",
    "research recommendations",
    "OpenAlex",
  ],
  authors: [{ name: "Econvery" }],
  openGraph: {
    title: "Econvery — Discover Research That Matters",
    description:
      "Personalized academic paper discovery for economics and political science researchers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f2ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Ambient background orbs */}
        <div className="ambient">
          <div className="ambient-orb" />
          <div className="ambient-orb" />
        </div>
        {children}
      </body>
    </html>
  );
}
