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
  title: "MUVIONT | Premium Cinematic Streaming Platform",
  description: "Stream movies, TV shows, and anime in pristine 4K quality. Discover personalized recommendations powered by Gemini AI. Fast, ad-free player experience.",
  metadataBase: new URL(
    process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("localhost")
      ? process.env.BETTER_AUTH_URL
      : "https://muviont.com"
  ),
  keywords: [
    "muviont",
    "muviont.com",
    "watch movies online",
    "stream series free",
    "watch anime english sub",
    "gemini ai recommendations",
    "4k movies streaming",
    "ad-free video player",
  ],
  authors: [{ name: "Muviont team", url: "https://muviont.com" }],
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "MUVIONT | Premium Cinematic Streaming Platform",
    description: "Stream movies, TV shows, and anime in pristine 4K quality on MUVIONT.",
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
