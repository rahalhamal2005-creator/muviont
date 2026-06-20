import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MUVIONT | Luxury Cinematic Streaming Platform",
  description: "Next-generation streaming platform delivering unmatched cinematic visual depth, AI searches, and curated news.",
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.jpg",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MUVIONT | Luxury Cinematic Streaming Hub",
    description: "Next-generation streaming platform valued for premium performance, AI searches, and content aesthetics.",
    url: "/",
    siteName: "MUVIONT",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MUVIONT Cinema Brand Backdrop",
      },
    ],
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
    <html lang="en" className="dark bg-black selection:bg-red-600 selection:text-white">
      <body className={`${inter.variable} antialiased bg-black text-white font-sans overflow-x-hidden min-h-screen`}>
        {children}

        {/* PWA Service Worker Client Script Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Muviont ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.warn('Muviont ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
