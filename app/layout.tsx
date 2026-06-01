import type { Metadata } from "next";
import { Literata, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";

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
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-28 sm:pt-12">
          {children}
        </div>
        <BottomNav />
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
