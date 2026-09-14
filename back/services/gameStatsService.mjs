import { DICE_REGISTRY } from "../config/diceRegistry.mjs";

// ─────────────────────────────────────────────────────────────────────────
// Statistiques d'une partie, calculées en mémoire à partir des messages.
//
// Toutes les fonctions de ce module sont PURES : elles prennent des données
// déjà chargées et ne touchent ni à Mongo ni à Express. C'est ce qui les rend
// testables par `npm run test:unit`, qui ne monte aucune base.
//
// Vocabulaire, tenu strictement dans tout le module :
//   - un « jet » (rolls) = un message de type dice-roll, une action de joueur
//   - un « dé » (dice)   = un résultat individuel dans diceRoll.results
// Lancer 4d6 d'un coup, c'est 1 jet et 4 dés.
// ─────────────────────────────────────────────────────────────────────────

// Espérance et écart-type d'un dé uniforme à `faces` faces.
export const diceMean = (faces) => (faces + 1) / 2;
export const diceStdDev = (faces) => Math.sqrt((faces * faces - 1) / 12);

const isDiceRoll = (m) =>
    m.type === "dice-roll" &&
    m.diceRoll &&
    Array.isArray(m.diceRoll.results) &&
    m.diceRoll.results.length > 0 &&
    DICE_REGISTRY[m.diceRoll.diceType] !== undefined;

const byDateAsc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);

export function computeDiceStats(messages) {
    const rolls = messages.filter(isDiceRoll).sort(byDateAsc);

    const players = new Map();
    const perType = new Map();
    const d20Histogram = Array(20).fill(0);

    let totalDice = 0;
    let totalPips = 0;
    let bestRoll = null;
    let worstRoll = null;

    const playerFor = (m) => {
        const key = String(m.userId);
        if (!players.has(key)) {
            players.set(key, {
                userId: key,
                username: m.username,
                rolls: 0,
                dice: 0,
                pips: 0,
                natMax: 0,
                natOne: 0,
                zSum: 0,
                // Plus gros lot de dés lancé d'un coup (4d6 => 4).
                biggestBatch: 0,
                // Série courante et record de d20 sans nat 20.
                currentStreak: 0,
                coldStreak: 0,
            });
        }
        return players.get(key);
    };

    for (const m of rolls) {
        const { diceType, results } = m.diceRoll;
        const { faces } = DICE_REGISTRY[diceType];
        const mu = diceMean(faces);
        const sigma = diceStdDev(faces);
        const p = playerFor(m);

        p.rolls += 1;
        if (results.length > p.biggestBatch) p.biggestBatch = results.length;

        const typeEntry = perType.get(diceType) ?? { diceType, rolls: 0, dice: 0 };
        typeEntry.rolls += 1;
        typeEntry.dice += results.length;
        perType.set(diceType, typeEntry);

        for (const r of results) {
            totalDice += 1;
            totalPips += r;
            p.dice += 1;
            p.pips += r;
            p.zSum += (r - mu) / sigma;

            if (r === faces) p.natMax += 1;
            if (r === 1) p.natOne += 1;

            if (diceType === "d20") {
                d20Histogram[r - 1] += 1;
                if (r === 20) {
                    p.currentStreak = 0;
                } else {
                    p.currentStreak += 1;
                    if (p.currentStreak > p.coldStreak) p.coldStreak = p.currentStreak;
                }
            }

            // « Meilleur » et « pire » se comparent en écarts-types, sinon un
            // 80 sur d100 écraserait un 20 naturel sur d20.
            const z = (r - mu) / sigma;
            const record = {
                userId: String(m.userId),
                username: m.username,
                diceType,
                result: r,
                results,
                total: m.diceRoll.total,
                createdAt: m.createdAt,
                z,
            };
            if (!bestRoll || z > bestRoll.z) bestRoll = record;
            if (!worstRoll || z < worstRoll.z) worstRoll = record;
        }
    }

    const byPlayer = [...players.values()]
        .map(({ currentStreak, zSum, ...p }) => ({
            ...p,
            // Somme standardisée : ~N(0,1) si les dés sont équitables. Diviser
            // par sqrt(n) rend l'indice comparable entre joueurs qui n'ont pas
            // lancé le même nombre de dés, et la normalisation par sigma le
            // rend comparable entre types de dés.
            luckIndex: p.dice > 0 ? zSum / Math.sqrt(p.dice) : 0,
        }))
        .sort((a, b) => b.dice - a.dice);

    return {
        totalRolls: rolls.length,
        totalDice,
        totalPips,
        byPlayer,
        byDiceType: [...perType.values()].sort((a, b) => b.dice - a.dice),
        d20Histogram,
        bestRoll,
        worstRoll,
    };
}

// Au-delà de cette coupure sans message, on considère qu'une nouvelle session
// de jeu commence. Valeur exportée pour être testable et ajustable.
export const SESSION_GAP_MS = 4 * 60 * 60 * 1000;

// Mots vides FR + EN. Volontairement courte : on filtre aussi tout ce qui fait
// moins de 3 caractères, ce qui élimine déjà l'essentiel du bruit.
const STOPWORDS = new Set([
    "les", "des", "une", "que", "qui", "pas", "pour", "dans", "sur", "avec",
    "est", "sont", "mais", "tout", "tous", "plus", "cette", "son", "ses",
    "vous", "nous", "elle", "ils", "elles", "lui", "leur", "ont", "fait",
    "the", "and", "for", "you", "that", "this", "with", "was", "are", "have",
    "not", "but", "his", "her", "they",
]);

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

export function median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

export function computeChatStats(messages) {
    const all = [...messages].sort(byDateAsc);
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    const players = new Map();
    const wordCounts = new Map();
    const emojiCounts = new Map();
    const delays = [];

    const playerFor = (m) => {
        const key = String(m.userId);
        if (!players.has(key)) {
            players.set(key, {
                userId: key,
                username: m.username,
                messages: 0,
                textMessages: 0,
                diceMessages: 0,
                totalLength: 0,
                replyDelays: [],
                // Histogramme horaire UTC, pivoté côté client pour le badge
                // du Noctambule, qui dépend du fuseau du lecteur.
                hours: Array(24).fill(0),
            });
        }
        return players.get(key);
    };

    for (let i = 0; i < all.length; i++) {
        const m = all[i];
        const at = new Date(m.createdAt);
        const p = playerFor(m);

        p.messages += 1;
        p.hours[at.getUTCHours()] += 1;
        heatmap[at.getUTCDay()][at.getUTCHours()] += 1;

        if (m.type === "text") {
            p.textMessages += 1;
            p.totalLength += (m.content ?? "").length;

            for (const raw of (m.content ?? "").toLowerCase().split(/[^\p{L}\p{N}-]+/u)) {
                const w = raw.replace(/^-+|-+$/g, "");
                if (w.length < 3 || STOPWORDS.has(w)) continue;
                wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
            }
            for (const e of (m.content ?? "").match(EMOJI_RE) ?? []) {
                emojiCounts.set(e, (emojiCounts.get(e) ?? 0) + 1);
            }
        } else {
            p.diceMessages += 1;
        }

        if (i > 0) {
            const prev = all[i - 1];
            const delta = at - new Date(prev.createdAt);
            // Les coupures entre sessions ne mesurent pas le rythme de la
            // table, elles mesurent le calendrier. On les écarte.
            if (delta <= SESSION_GAP_MS) {
                delays.push(delta);
                if (String(prev.userId) !== String(m.userId)) {
                    p.replyDelays.push(delta);
                }
            }
        }
    }

    const totalMessages = all.length;
    const byPlayer = [...players.values()]
        .map(({ totalLength, replyDelays, ...p }) => ({
            ...p,
            share: totalMessages > 0 ? p.messages / totalMessages : 0,
            avgLength: p.textMessages > 0 ? totalLength / p.textMessages : 0,
            medianReplyMs: median(replyDelays),
        }))
        .sort((a, b) => b.messages - a.messages);

    const top = (map, n) =>
        [...map.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, n);

    return {
        totalMessages,
        byPlayer,
        heatmap,
        medianDelayMs: median(delays),
        topWords: top(wordCounts, 20).map(([word, count]) => ({ word, count })),
        topEmojis: top(emojiCounts, 10).map(([emoji, count]) => ({ emoji, count })),
    };
}

// Aucune donnée de présence n'est persistée : les « sessions » sont déduites
// des horodatages de messages. Approximation assumée — un joueur silencieux
// plus de SESSION_GAP_MS est compté comme parti.
export function computeSessionStats(messages, game) {
    const all = [...messages].sort(byDateAsc);

    if (all.length === 0) {
        return {
            count: 0,
            avgDurationMs: 0,
            longestDurationMs: 0,
            firstActivityAt: null,
            lastActivityAt: null,
            campaignDurationMs: 0,
        };
    }

    const sessions = [];
    let start = new Date(all[0].createdAt);
    let end = start;

    for (let i = 1; i < all.length; i++) {
        const at = new Date(all[i].createdAt);
        // Strictement supérieur : une coupure de pile 4 h reste la même session.
        if (at - end > SESSION_GAP_MS) {
            sessions.push(end - start);
            start = at;
        }
        end = at;
    }
    sessions.push(end - start);

    const firstActivityAt = new Date(all[0].createdAt);
    const lastActivityAt = new Date(all[all.length - 1].createdAt);

    return {
        count: sessions.length,
        avgDurationMs: sessions.reduce((a, b) => a + b, 0) / sessions.length,
        longestDurationMs: Math.max(...sessions),
        firstActivityAt,
        lastActivityAt,
        campaignDurationMs: lastActivityAt - new Date(game.createdAt),
    };
}
