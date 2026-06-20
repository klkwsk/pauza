import type { Metadata } from "next";
import { Literata, Geist, Geist_Mono, Archivo_Black, Chewy } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const literata = Literata({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const chewy = Chewy({
  variable: "--font-chewy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pauza — dziennik",
  description: "Prosty dziennik codziennych myśli i nastroju.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} ${archivoBlack.variable} ${chewy.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background">
        <AppShell>{children}</AppShell>
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
