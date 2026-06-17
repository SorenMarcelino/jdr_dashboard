import { resolveSystemId } from "@/lib/system-id";

/**
 * Thèmes visuels par système de jeu.
 *
 * Chaque systemId listé ici possède un bloc de variables CSS dédié dans
 * globals.css, ciblé par le sélecteur `[data-game-theme="<systemId>"]`
 * (variantes clair + sombre). L'attribut est posé sur `<html>` pendant une
 * partie via le hook `useGameTheme`, ce qui surcharge la palette shadcn/ui
 * (couleurs, rayons…) pour toute l'UI, portals compris.
 *
 * Pour ajouter un thème : ajouter le systemId ici puis le bloc CSS
 * correspondant dans globals.css.
 */
const THEMED_SYSTEMS = new Set<string>([
    "magnus_archives",
]);

/**
 * Retourne le systemId à appliquer comme thème de jeu, ou `null` si le système
 * n'a pas de thème dédié (on garde alors la palette par défaut de l'app).
 */
export function getGameTheme(characterSheet?: string | null): string | null {
    if (!characterSheet) return null;
    const systemId = resolveSystemId(characterSheet);
    return THEMED_SYSTEMS.has(systemId) ? systemId : null;
}
