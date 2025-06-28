// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from 'next/link';
import React from "react"; // Import Link for external links

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Customizable Form & Survey Tool", // A more general default title
  description: "Create and manage custom questionnaires and view submissions.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} // Added flex-col to enable footer to push to bottom
    >
    <main className="flex-grow">
      {children}
    </main>
    <footer className="w-full bg-gray-800 text-white p-4 text-center mt-auto"> {/* mt-auto pushes footer to bottom */}
      <p className="text-sm">
        Powered by{' '}
        <Link
          href="https://github.com/pr0meth4us"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          pr0meth4us (GitHub)
        </Link>
      </p>
    </footer>
    </body>
    </html>
  );
}