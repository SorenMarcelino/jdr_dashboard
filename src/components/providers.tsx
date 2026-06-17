"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/dark-mode-toggle/theme-provider";
// Import à effet de bord : enregistre l'intercepteur axios (refresh token)
// et les valeurs par défaut (withCredentials) au chargement côté client.
import "@/lib/api";

export function Providers({
    children,
    nonce,
}: {
    children: React.ReactNode;
    nonce?: string;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            nonce={nonce}
        >
            {children}
        </ThemeProvider>
    );
}
