// Couleurs de l'éditeur de scénario (texte, surlignage, bloc MJ).
// Module pur, sans import runtime : testé directement par `node --test`.

export type PaletteColor = { key: string; value: string };

// Couleurs proposées par défaut. `key` est la clé i18n du nom de la couleur
// dans le namespace `common.colorPalette`.
export const DEFAULT_COLORS: PaletteColor[] = [
    { key: "red", value: "#ef4444" },
    { key: "orange", value: "#f97316" },
    { key: "yellow", value: "#eab308" },
    { key: "green", value: "#22c55e" },
    { key: "blue", value: "#3b82f6" },
    { key: "purple", value: "#a855f7" },
    { key: "pink", value: "#ec4899" },
];

export const MAX_SAVED_COLORS = 24;

const SHORT_HEX = /^#([0-9a-f]{3})$/;
const LONG_HEX = /^#[0-9a-f]{6}$/;

// Hex `#rrggbb` minuscule, ou null pour toute autre valeur. Toute couleur
// venant du contenu passe par ici avant d'atterrir dans un attribut `style`.
export function normalizeHex(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const hex = value.trim().toLowerCase();
    const short = SHORT_HEX.exec(hex);
    if (short) return "#" + [...short[1]].map((c) => c + c).join("");
    return LONG_HEX.test(hex) ? hex : null;
}

// Ajoute une couleur en tête de liste. Renvoie la même liste si la couleur
// est invalide ou fait déjà partie des couleurs par défaut.
export function addSavedColor(list: string[], color: string): string[] {
    const hex = normalizeHex(color);
    if (!hex || DEFAULT_COLORS.some((c) => c.value === hex)) return list;
    return [hex, ...list.filter((c) => c !== hex)].slice(0, MAX_SAVED_COLORS);
}

export function removeSavedColor(list: string[], color: string): string[] {
    const hex = normalizeHex(color);
    return list.filter((c) => c !== hex);
}

// Fond de surlignage semi-transparent, lisible en thème clair comme sombre.
export function highlightBackground(hex: string): string {
    return `color-mix(in srgb, ${hex} 35%, transparent)`;
}
