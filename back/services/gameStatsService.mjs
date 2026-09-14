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
