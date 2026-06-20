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
  title: "MUVIONT | Premium Streaming Platform",
  description: "Watch movies, series, and anime in cinematic quality. Powered by AI search, personalized recommendations, and premium streaming.",
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.jpg",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MUVIONT | Premium Streaming Platform",
    description: "Watch movies, series, and anime in cinematic quality on MUVIONT.",
    url: "/",
    siteName: "MUVIONT",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "MUVIONT" }],
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
