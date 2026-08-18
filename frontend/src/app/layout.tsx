import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOTERIA — Offline-First Multimodal AI Disaster Triage & GIS Platform",
  description:
    "A unified intelligence layer that converts chaotic distress voice notes, photos, and messages into prioritized, geospatially clustered disaster response actions in real time.",
  keywords: ["disaster triage", "multimodal AI", "PostGIS", "FastAPI", "Next.js", "emergency response", "PWA", "IndexedDB"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SOTERIA",
  },
};

export const viewport: Viewport = {
  themeColor: "#DC2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#090D16] text-slate-100 antialiased selection:bg-red-600 selection:text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SOTERIA PWA] ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.warn('[SOTERIA PWA] ServiceWorker registration failed: ', err);
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
