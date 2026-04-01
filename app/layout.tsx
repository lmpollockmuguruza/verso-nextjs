import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "verso — recent research, surfaced for you",
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
  authors: [{ name: "verso" }],
  openGraph: {
    title: "verso — recent research, surfaced for you",
    description:
      "Personalized academic paper discovery for economics and political science researchers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('verso-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
