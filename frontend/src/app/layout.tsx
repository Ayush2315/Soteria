import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOTERIA — Offline-First Multimodal AI Disaster Triage Platform",
  description:
    "A unified intelligence layer that converts chaotic distress voice notes, photos, and messages into prioritized, geospatially clustered disaster response actions in real time.",
  keywords: ["disaster triage", "multimodal AI", "PostGIS", "FastAPI", "Next.js", "emergency response"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
