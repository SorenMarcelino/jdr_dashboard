export type RollRecord = {
    userId: string;
    username: string;
    diceType: string;
    result: number;
    results: number[];
    total: number;
    createdAt: string;
    z: number;
};

export type DicePlayerStats = {
    userId: string;
    username: string;
    rolls: number;
    dice: number;
    pips: number;
    natMax: number;
    natOne: number;
    coldStreak: number;
    biggestBatch: number;
    d20Dice: number;
    d20Nat20: number;
    luckIndex: number;
};

export type ChatPlayerStats = {
    userId: string;
    username: string;
    messages: number;
    textMessages: number;
    diceMessages: number;
    share: number;
    avgLength: number;
    medianReplyMs: number;
    /** Histogramme horaire UTC, 24 entrées. Pivoté côté client. */
    hours: number[];
};

/** Une face remarquable : sa valeur et le dé qui l'a donnée. */
export type DiceFace = { result: number; diceType: string };

/**
 * Une ligne du détail des dés. `userId`/`username` null = tous les joueurs,
 * `diceType` null = tous les types.
 */
export type DiceBreakdownRow = {
    userId: string | null;
    username: string | null;
    diceType: string | null;
    rolls: number;
    dice: number;
    /** Moyenne brute des faces ; null sur les lignes tous types. */
    average: number | null;
    /** Moyenne des faces ramenées à 0–100 % du max (50 = chance normale). */
    averagePct: number;
    best: DiceFace;
    worst: DiceFace;
};

export type Badge = {
    id: string;
    userId: string;
    username: string;
    value: number;
};

export type GameStats = {
    meta: { gameId: string; gameName: string; playerCount: number; messageCount: number; truncated: boolean };
    dice: {
        totalRolls: number;
        totalDice: number;
        totalPips: number;
        byPlayer: DicePlayerStats[];
        byDiceType: { diceType: string; rolls: number; dice: number }[];
        d20Histogram: number[];
        bestRoll: RollRecord | null;
        worstRoll: RollRecord | null;
        breakdown: DiceBreakdownRow[];
    };
    chat: {
        totalMessages: number;
        byPlayer: ChatPlayerStats[];
        heatmap: number[][];
        medianDelayMs: number;
        topWords: { word: string; count: number }[];
        topEmojis: { emoji: string; count: number }[];
    };
    sessions: {
        count: number;
        avgDurationMs: number;
        longestDurationMs: number;
        firstActivityAt: string | null;
        lastActivityAt: string | null;
        campaignDurationMs: number;
    };
    badges: Badge[];
};
