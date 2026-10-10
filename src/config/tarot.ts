// Tarot : dispositions et types partagés (le serveur fait foi, cf.
// back/config/tarotRegistry.mjs). Le contenu des lames vit dans le skin.

export type TarotSpread = "unique" | "trois" | "croix";

export type TarotCard = { cardId: string; reversed: boolean };

/** Place d'une lame dans une disposition : clé de traduction + case de la grille. */
export type TarotSlot = { key: string; col: number; row: number };

export const TAROT_SPREADS: Record<TarotSpread, { cols: number; slots: TarotSlot[] }> = {
    unique: { cols: 1, slots: [{ key: "conseil", col: 1, row: 1 }] },
    trois: {
        cols: 3,
        slots: [
            { key: "passe", col: 1, row: 1 },
            { key: "present", col: 2, row: 1 },
            { key: "avenir", col: 3, row: 1 },
        ],
    },
    // Croix du Tarot de Marseille : pour, contre, jugement, issue, synthèse.
    croix: {
        cols: 3,
        slots: [
            { key: "pour", col: 1, row: 2 },
            { key: "contre", col: 3, row: 2 },
            { key: "jugement", col: 2, row: 1 },
            { key: "issue", col: 2, row: 3 },
            { key: "synthese", col: 2, row: 2 },
        ],
    },
};

export const TAROT_SPREAD_LIST: TarotSpread[] = ["unique", "trois", "croix"];

/** Table de tarot vue par le membre courant (événement "tarot:state"). */
export type TarotState = {
    gameId: string;
    status: "idle" | "open" | "done";
    spread?: TarotSpread;
    allowReversed?: boolean;
    secret?: boolean;
    /** Tireur : un joueur, le MJ, ou un PNJ (le MJ tire alors à sa place). */
    drawer?: { id: string; username: string; npc?: boolean };
    total?: number;
    drawn?: number;
    remaining?: number;
    /** false : tirage secret, les lames sont cachées à ce membre. */
    visible?: boolean;
    cards?: TarotCard[];
};

export type TarotGrant = {
    spread: TarotSpread;
    allowReversed: boolean;
    secret: boolean;
    /** Joueur désigné, ou le MJ lui-même (y compris pour un PNJ). */
    drawerId: string;
    /** Tirage pour un PNJ : le MJ tire, le tirage porte ce nom. */
    npcName?: string;
};

/** Tirage consigné au chat (message de type "tarot"). */
export type TarotDrawData = {
    spread: TarotSpread;
    secret: boolean;
    drawerId?: string;
    drawerName?: string;
    npc?: boolean;
    count: number;
    visible: boolean;
    cards: TarotCard[];
};
