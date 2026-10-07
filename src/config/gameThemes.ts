import { resolveSystemId } from "@/lib/system-id";

/**
 * Thèmes visuels par système de jeu.
 *
 * Chaque systemId listé ici possède une feuille de style dédiée
 * (`src/themes/<systemId>/theme.css`), ciblée par le sélecteur
 * `[data-game-theme="<systemId>"]`. L'attribut est posé sur `<html>` pendant
 * une partie via le hook `useGameTheme`, ce qui surcharge la palette shadcn/ui
 * (couleurs, rayons, polices…) pour toute l'UI, portals compris.
 *
 * `colorScheme` force le mode clair/sombre le temps de la partie, pour les
 * thèmes conçus pour un seul mode.
 *
 * Pour ajouter un thème : l'ajouter ici, créer sa feuille de style et
 * l'importer dans `src/app/layout.tsx` (cf. aussi `src/themes/registry.ts`
 * pour les composants propres à l'univers).
 */
type GameThemeConfig = {
    colorScheme?: "light" | "dark";
};

const GAME_THEMES: Record<string, GameThemeConfig> = {
    magnus_archives: { colorScheme: "dark" },
};

/**
 * Retourne le systemId à appliquer comme thème de jeu, ou `null` si le système
 * n'a pas de thème dédié (on garde alors la palette par défaut de l'app).
 */
export function getGameTheme(characterSheet?: string | null): string | null {
    if (!characterSheet) return null;
    const systemId = resolveSystemId(characterSheet);
    return systemId in GAME_THEMES ? systemId : null;
}

/** Mode clair/sombre imposé par le thème, ou `undefined` s'il suit la préférence. */
export function getGameThemeColorScheme(theme: string | null): "light" | "dark" | undefined {
    return theme ? GAME_THEMES[theme]?.colorScheme : undefined;
}
