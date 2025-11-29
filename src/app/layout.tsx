import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Vibe - AI-Powered Issue Tracking",
    template: "%s | Vibe",
  },
  description:
    "A modern, AI-powered issue tracking application for teams. Manage projects, track issues, and collaborate seamlessly with intelligent automation.",
  keywords: [
    "issue tracking",
    "project management",
    "AI",
    "team collaboration",
    "kanban",
    "agile",
    "task management",
  ],
  authors: [{ name: "Hung Nguyen", url: "mailto:nmhp1903@gmail.com" }],
  creator: "Hung Nguyen",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vibe",
    title: "Vibe - AI-Powered Issue Tracking",
    description:
      "A modern, AI-powered issue tracking application for teams. Manage projects, track issues, and collaborate seamlessly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe - AI-Powered Issue Tracking",
    description: "A modern, AI-powered issue tracking application for teams.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
