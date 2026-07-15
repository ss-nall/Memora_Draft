import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memora | Next-Gen AI Event Photography",
  description: "Capture, analyze, and distribute event memories instantly using cutting-edge AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col text-[var(--foreground)] bg-[var(--background)]">
        <AuthProvider>
          <header className="sticky top-0 z-50 w-full border-b border-[var(--color-surface-border)] bg-background/80 backdrop-blur-lg">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Memora
              </div>
              <nav className="flex items-center gap-6 text-sm font-medium">
                <a href="/events" className="hover:text-purple-400 transition-colors">Events</a>
                <a href="/dashboard" className="hover:text-purple-400 transition-colors">Dashboard</a>
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
