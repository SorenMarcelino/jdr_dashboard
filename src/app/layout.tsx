import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import React from "react";
import { Providers } from "@/components/providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "JDR Dashboard",
    description: "Gestion de parties de jeu de rôle en ligne",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Nonce CSP posé par le middleware ; transmis à next-themes pour que son
    // script inline (anti-flash de thème) soit autorisé par la CSP.
    const nonce = (await headers()).get("x-nonce") ?? undefined;

    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers nonce={nonce}>{children}</Providers>
            </body>
        </html>
    );
}
