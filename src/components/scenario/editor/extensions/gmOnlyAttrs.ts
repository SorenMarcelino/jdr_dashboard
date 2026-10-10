// Valeurs et normalisation des attributs du bloc « MJ uniquement ».
// Module pur, sans import runtime : testé directement par `node --test`.

export const DEFAULT_GM_EMOJI = "🙈";

export const GM_EMOJI_PRESETS = ["🙈", "🔒", "👁️", "💀", "📜", "⚔️", "🔮", "🐉", "💰", "⚠️", "🎲", "🗝️"];

export const GM_LABEL_MAX = 40;

// Premier graphème (un emoji composé comme 🧙‍♂️ ou 🇫🇷 compte pour un), ou null.
export function normalizeGmEmoji(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    return first.done ? null : first.value.segment;
}

// Libellé nettoyé, limité à GM_LABEL_MAX code points ; null = libellé traduit.
export function normalizeGmLabel(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return Array.from(trimmed).slice(0, GM_LABEL_MAX).join("");
}
