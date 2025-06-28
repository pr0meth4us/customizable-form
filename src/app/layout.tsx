import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";

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
    title: "Customizable Form & Survey Tool",
    description: "Create and manage custom questionnaires and view submissions.",
};

export default function RootLayout() {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
        <main className="flex-grow">
        </main>
        <footer className="w-full bg-gray-100 dark:bg-gray-800 py-4 mt-8">
            <div className="container mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                    Built by pr0meth4us. All rights reserved &copy; {new Date().getFullYear()}.
                </p>
                <p className="mt-1">
                    <Link
                        href="https://github.com/pr0meth4us"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                        Check out my GitHub
                    </Link>
                </p>
            </div>
        </footer>
        </body>
        </html>
    );
}