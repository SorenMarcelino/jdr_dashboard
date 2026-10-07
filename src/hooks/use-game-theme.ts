import { useEffect } from "react";
import { getGameThemeColorScheme } from "@/config/gameThemes";
import { useSetForcedTheme } from "@/components/providers";

/**
 * Applique un thème de jeu en posant `data-game-theme` sur `<html>` le temps
 * de la partie. Les variables CSS du thème surchargent alors la palette
 * pour toute l'UI (y compris les portals : popovers, dialogs, tooltips).
 * Si le thème impose un mode (ex : Magnus, toujours sombre), il est forcé
 * via next-themes sans toucher à la préférence enregistrée.
 *
 * Passer `null` ne pose aucun attribut (palette par défaut de l'app).
 * L'attribut est retiré au démontage / changement de thème.
 */
export function useGameTheme(theme: string | null) {
    const setForcedTheme = useSetForcedTheme();
    const colorScheme = getGameThemeColorScheme(theme);

    useEffect(() => {
        if (!theme) return;
        const root = document.documentElement;
        root.setAttribute("data-game-theme", theme);
        return () => {
            root.removeAttribute("data-game-theme");
        };
    }, [theme]);

    useEffect(() => {
        if (!colorScheme) return;
        setForcedTheme(colorScheme);
        return () => setForcedTheme(undefined);
    }, [colorScheme, setForcedTheme]);
}
