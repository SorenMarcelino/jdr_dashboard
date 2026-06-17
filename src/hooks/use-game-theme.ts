import { useEffect } from "react";

/**
 * Applique un thème de jeu en posant `data-game-theme` sur `<html>` le temps
 * de la partie. Les variables CSS de globals.css surchargent alors la palette
 * pour toute l'UI (y compris les portals : popovers, dialogs, tooltips).
 *
 * Passer `null` ne pose aucun attribut (palette par défaut de l'app).
 * L'attribut est retiré au démontage / changement de thème.
 */
export function useGameTheme(theme: string | null) {
    useEffect(() => {
        if (!theme) return;
        const root = document.documentElement;
        root.setAttribute("data-game-theme", theme);
        return () => {
            root.removeAttribute("data-game-theme");
        };
    }, [theme]);
}
