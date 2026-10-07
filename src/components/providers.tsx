"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/dark-mode-toggle/theme-provider";
// Import à effet de bord : enregistre l'intercepteur axios (refresh token)
// et les valeurs par défaut (withCredentials) au chargement côté client.
import "@/lib/api";

type ForcedTheme = "light" | "dark" | undefined;

// Permet à une page (ex : partie au thème toujours sombre) d'imposer un mode
// à next-themes sans écraser la préférence enregistrée de l'utilisateur.
const SetForcedThemeContext = React.createContext<(theme: ForcedTheme) => void>(() => {});

export function useSetForcedTheme() {
    return React.useContext(SetForcedThemeContext);
}

export function Providers({
    children,
    nonce,
}: {
    children: React.ReactNode;
    nonce?: string;
}) {
    const [forcedTheme, setForcedTheme] = React.useState<ForcedTheme>(undefined);

    return (
        <SetForcedThemeContext.Provider value={setForcedTheme}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                forcedTheme={forcedTheme}
                nonce={nonce}
            >
                {children}
            </ThemeProvider>
        </SetForcedThemeContext.Provider>
    );
}
