import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers nonce={nonce}>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
