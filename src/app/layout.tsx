import type { Metadata } from "next";
import { Archivo_Narrow, Caveat, Courier_Prime, EB_Garamond, Geist, Geist_Mono, IM_Fell_English_SC, Old_Standard_TT } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
// Feuilles de style des thèmes de jeu (actives seulement sous data-game-theme)
import "@/themes/magnus_archives/theme.css";
import "@/themes/hydre/theme.css";
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

// Polices du thème Magnus Archives : pas de préchargement, elles ne sont
// téléchargées que lorsqu'une page thématisée les utilise.
const oldStandard = Old_Standard_TT({
    variable: "--font-old-standard",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal", "italic"],
    preload: false,
});

const courierPrime = Courier_Prime({
    variable: "--font-courier-prime",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal", "italic"],
    preload: false,
});

const archivoNarrow = Archivo_Narrow({
    variable: "--font-archivo-narrow",
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    preload: false,
});

// Polices du thème Hydre (mêmes principes) : capitales victoriennes pour les
// titres, Garamond pour le texte, écriture manuscrite pour les valeurs de fiche.
const imFellSc = IM_Fell_English_SC({
    variable: "--font-im-fell-sc",
    subsets: ["latin"],
    weight: "400",
    preload: false,
});

const ebGaramond = EB_Garamond({
    variable: "--font-eb-garamond",
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    style: ["normal", "italic"],
    preload: false,
});

const caveat = Caveat({
    variable: "--font-caveat",
    subsets: ["latin"],
    weight: ["400", "600"],
    preload: false,
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
        // Variables de police sur <html> : les thèmes de jeu (posés sur <html>)
        // les référencent dans leurs propres variables.
        <html
            lang={locale}
            className={`${geistSans.variable} ${geistMono.variable} ${oldStandard.variable} ${courierPrime.variable} ${archivoNarrow.variable} ${imFellSc.variable} ${ebGaramond.variable} ${caveat.variable}`}
            suppressHydrationWarning
        >
            <body className="antialiased">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers nonce={nonce}>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
