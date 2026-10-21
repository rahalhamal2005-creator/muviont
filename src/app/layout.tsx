import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MUVIONT — Cinematic Film Discovery, Ratings & AI Entertainment Guide",
  description: "Explore top-rated movies, trending TV shows, and anime with smart Gemini AI recommendations. Discover cast details, synopsis, ratings, and cinematic previews on MUVIONT.",
  metadataBase: new URL("https://muviont.com"),
  keywords: [
    "muviont",
    "muviont.com",
    "movie discovery",
    "entertainment guide",
    "film ratings",
    "gemini ai recommendations",
    "cinema catalog",
    "trailers and reviews",
  ],
  authors: [{ name: "Muviont team", url: "https://muviont.com" }],
  icons: {
    icon: [
      { url: "/logo-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "MUVIONT — Cinematic Film Discovery & Entertainment Guide",
    description: "Discover trending movies, TV series, and anime with smart AI recommendations on MUVIONT.",
    url: "https://muviont.com",
    siteName: "MUVIONT",
    images: [{ url: "/logo-icon.svg", width: 512, height: 512, alt: "MUVIONT" }],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} antialiased`} style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
        {children}

        {/* PWA Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
