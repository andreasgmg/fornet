import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Importera Toaster för notiser
import { Toaster } from "sonner";
import SiteHeader from '@/components/SiteHeader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Uppdatera sidans namn och beskrivning (Syns på Google/Fliken)
export const metadata: Metadata = {
  title: "Fornet",
  description: "Föreningsnätet för moderna vägföreningar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Ändra språk till svenska (bra för SEO/Skärmläsare)
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {children}

        {/* 4. Lägg in Toaster här så notiser kan visas ovanpå allt annat */}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}