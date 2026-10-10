import crypto from "node:crypto";

// Lames de chaque système. Le serveur ne connaît que les identifiants : noms,
// images et interprétations appartiennent au skin de l'univers côté client.
export const TAROT_DECKS = {
    magnus_archives: [
        "archiviste", "oeil", "spirale", "etranger", "enseveli", "vaste",
        "solitaire", "tenebres", "traque", "carnage", "chair", "corruption",
        "desolation", "toile", "fin", "extinction", "deposition",
    ],
    // Les 22 arcanes majeurs du Tarot de Marseille, dans l'ordre.
    hydre: [
        "mat", "bateleur", "papesse", "imperatrice", "empereur", "pape",
        "amoureux", "chariot", "justice", "hermite", "roue", "force",
        "pendu", "sansnom", "temperance", "diable", "maisondieu", "etoile",
        "lune", "soleil", "jugement", "monde",
    ],
};

// Dispositions proposées et nombre de lames tirées pour chacune.
export const TAROT_SPREADS = {
    unique: 1,
    trois: 3,
    croix: 5,
};

// Même correspondance que src/lib/system-id.ts (le champ characterSheet d'une
// partie contient le nom affiché du système ou son identifiant).
const SYSTEM_ID_MAP = {
    "Magnus Archives": "magnus_archives",
    magnus_archives: "magnus_archives",
    Hydre: "hydre",
};

export function resolveSystemId(characterSheet) {
    if (typeof characterSheet !== "string") return "";
    return SYSTEM_ID_MAP[characterSheet] ?? characterSheet.toLowerCase().replace(/\s+/g, "_");
}

/** Paquet du système de la partie, ou null si l'univers n'a pas de tarot. */
export function getTarotDeck(characterSheet) {
    return TAROT_DECKS[resolveSystemId(characterSheet)] ?? null;
}

/** Copie mélangée du paquet (Fisher-Yates, aléa cryptographique). */
export function shuffleDeck(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * Tire la lame du dessus. Retourne la lame (renversée au hasard si la partie
 * l'admet) et le paquet restant, ou null si le paquet est vide.
 */
export function drawCard(deck, allowReversed) {
    if (!Array.isArray(deck) || deck.length === 0) return null;
    const [cardId, ...rest] = deck;
    const reversed = allowReversed ? crypto.randomInt(2) === 1 : false;
    return { card: { cardId, reversed }, deck: rest };
}
