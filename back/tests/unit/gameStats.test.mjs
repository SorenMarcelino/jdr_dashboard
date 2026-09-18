import { test } from "node:test";
import assert from "node:assert/strict";
import {
    diceMean,
    diceStdDev,
    computeDiceStats,
    computeDiceBreakdown,
    SESSION_GAP_MS,
    median,
    computeChatStats,
    computeSessionStats,
    computeBadges,
    computeGameStats,
    BADGE_THRESHOLDS,
} from "../../services/gameStatsService.mjs";

// Fabrique un message de jet de dés.
const roll = ({ userId = "u1", username = "Alice", diceType = "d6", results = [3], at = "2026-01-01T12:00:00Z" }) => ({
    _id: `${userId}-${at}-${results.join(",")}`,
    userId,
    username,
    type: "dice-roll",
    content: "",
    diceRoll: {
        diceType,
        quantity: results.length,
        results,
        total: results.reduce((a, b) => a + b, 0),
    },
    createdAt: new Date(at),
});

test("diceMean and diceStdDev match the uniform distribution formulas", () => {
    assert.equal(diceMean(6), 3.5);
    assert.equal(diceMean(20), 10.5);
    // sigma = sqrt((F^2 - 1) / 12)
    assert.ok(Math.abs(diceStdDev(6) - Math.sqrt(35 / 12)) < 1e-12);
    assert.ok(Math.abs(diceStdDev(20) - Math.sqrt(399 / 12)) < 1e-12);
});

test("luckIndex is zero on a perfectly uniform sample, for any dice type", () => {
    // Chaque face exactement une fois => moyenne = mu => indice nul.
    const d6 = computeDiceStats([roll({ results: [1, 2, 3, 4, 5, 6] })]);
    assert.ok(Math.abs(d6.byPlayer[0].luckIndex) < 1e-12);

    const faces20 = Array.from({ length: 20 }, (_, i) => i + 1);
    const d20 = computeDiceStats([roll({ diceType: "d20", results: faces20 })]);
    assert.ok(Math.abs(d20.byPlayer[0].luckIndex) < 1e-12);
});

test("luckIndex sign follows the rolls", () => {
    const hot = computeDiceStats([roll({ results: [6, 6, 6, 6, 6, 6] })]);
    assert.ok(hot.byPlayer[0].luckIndex > 3);

    const cold = computeDiceStats([roll({ results: [1, 1, 1, 1, 1, 1] })]);
    assert.ok(cold.byPlayer[0].luckIndex < -3);
});

test("rolls and dice are counted separately", () => {
    const stats = computeDiceStats([
        roll({ results: [1, 2, 3, 4] }),
        roll({ results: [5] }),
    ]);
    assert.equal(stats.totalRolls, 2);
    assert.equal(stats.totalDice, 5);
    assert.equal(stats.byPlayer[0].rolls, 2);
    assert.equal(stats.byPlayer[0].dice, 5);
    assert.equal(stats.totalPips, 15);
});

test("natMax and natOne are counted per player", () => {
    const stats = computeDiceStats([
        roll({ diceType: "d20", results: [20, 1, 20, 11] }),
    ]);
    assert.equal(stats.byPlayer[0].natMax, 2);
    assert.equal(stats.byPlayer[0].natOne, 1);
});

test("d20Histogram counts every face, index 0 being face 1", () => {
    const stats = computeDiceStats([
        roll({ diceType: "d20", results: [1, 1, 20] }),
        roll({ diceType: "d6", results: [1] }), // ne doit pas polluer l'histogramme d20
    ]);
    assert.equal(stats.d20Histogram.length, 20);
    assert.equal(stats.d20Histogram[0], 2);
    assert.equal(stats.d20Histogram[19], 1);
    assert.equal(stats.d20Histogram[10], 0);
});

test("coldStreak is the longest run of d20 dice without a nat 20", () => {
    const stats = computeDiceStats([
        roll({ diceType: "d20", results: [5, 7, 9], at: "2026-01-01T10:00:00Z" }),
        roll({ diceType: "d20", results: [20], at: "2026-01-01T11:00:00Z" }),
        roll({ diceType: "d20", results: [2, 3], at: "2026-01-01T12:00:00Z" }),
    ]);
    assert.equal(stats.byPlayer[0].coldStreak, 3);
});

test("bestRoll and worstRoll pick the most extreme single die", () => {
    const stats = computeDiceStats([
        roll({ username: "Alice", diceType: "d20", results: [20] }),
        roll({ username: "Bob", userId: "u2", diceType: "d20", results: [1] }),
    ]);
    assert.equal(stats.bestRoll.username, "Alice");
    assert.equal(stats.worstRoll.username, "Bob");
});

test("computeDiceStats on an empty list returns zeroed aggregates", () => {
    const stats = computeDiceStats([]);
    assert.equal(stats.totalRolls, 0);
    assert.equal(stats.totalDice, 0);
    assert.equal(stats.totalPips, 0);
    assert.deepEqual(stats.byPlayer, []);
    assert.equal(stats.bestRoll, null);
    assert.equal(stats.worstRoll, null);
});

test("computeDiceStats ignores unknown dice types instead of throwing", () => {
    const stats = computeDiceStats([roll({ diceType: "d3", results: [2] })]);
    assert.equal(stats.totalRolls, 0);
});

// Fabrique un message texte.
const text = ({ userId = "u1", username = "Alice", content = "bonjour", at = "2026-01-01T12:00:00Z" }) => ({
    _id: `${userId}-${at}-${content}`,
    userId,
    username,
    type: "text",
    content,
    diceRoll: undefined,
    createdAt: new Date(at),
});

// Génère n messages texte pour franchir un seuil de badge.
const manyTexts = (n, userId, username, startHour = 10) =>
    Array.from({ length: n }, (_, i) =>
        text({
            userId,
            username,
            content: `message numero ${i}`,
            at: new Date(Date.UTC(2026, 0, 1, startHour, i)).toISOString(),
        })
    );

// Génère n dés d'un coup pour franchir un seuil de badge.
const manyDice = (n, userId, username, value, diceType = "d20") =>
    roll({ userId, username, diceType, results: Array(n).fill(value) });

test("median handles odd, even and empty inputs", () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 3, 2]), 2.5);
    assert.equal(median([]), 0);
});

test("speech share sums to 1 across players", () => {
    const stats = computeChatStats([
        text({ userId: "u1", username: "Alice" }),
        text({ userId: "u1", username: "Alice" }),
        text({ userId: "u2", username: "Bob" }),
        text({ userId: "u2", username: "Bob" }),
    ]);
    const sum = stats.byPlayer.reduce((acc, p) => acc + p.share, 0);
    assert.ok(Math.abs(sum - 1) < 1e-12);
    assert.equal(stats.totalMessages, 4);
});

test("text and dice messages are separated per player", () => {
    const stats = computeChatStats([
        text({ content: "salut" }),
        roll({ results: [4] }),
    ]);
    assert.equal(stats.byPlayer[0].textMessages, 1);
    assert.equal(stats.byPlayer[0].diceMessages, 1);
    assert.equal(stats.byPlayer[0].messages, 2);
});

test("avgLength only averages text messages", () => {
    const stats = computeChatStats([
        text({ content: "abcd" }),     // 4
        text({ content: "abcdef" }),   // 6
        roll({ results: [4] }),        // ignoré
    ]);
    assert.equal(stats.byPlayer[0].avgLength, 5);
});

test("heatmap is 7x24 and buckets by UTC day and hour", () => {
    // 2026-01-01 est un jeudi => getUTCDay() === 4
    const stats = computeChatStats([text({ at: "2026-01-01T15:30:00Z" })]);
    assert.equal(stats.heatmap.length, 7);
    assert.equal(stats.heatmap[0].length, 24);
    assert.equal(stats.heatmap[4][15], 1);
});

test("medianDelayMs ignores gaps larger than a session break", () => {
    const stats = computeChatStats([
        text({ at: "2026-01-01T10:00:00Z" }),
        text({ at: "2026-01-01T10:01:00Z" }), // +60 s, compté
        text({ at: "2026-01-02T10:00:00Z" }), // +24 h, ignoré
        text({ at: "2026-01-02T10:02:00Z" }), // +120 s, compté
    ]);
    assert.equal(stats.medianDelayMs, 90_000);
});

test("topWords drops stopwords and words shorter than 3 characters", () => {
    const stats = computeChatStats([
        text({ content: "le dragon et la porte, le dragon !" }),
    ]);
    const words = stats.topWords.map((w) => w.word);
    assert.ok(words.includes("dragon"));
    assert.ok(!words.includes("le"));
    assert.ok(!words.includes("et"));
    assert.equal(stats.topWords[0].word, "dragon");
    assert.equal(stats.topWords[0].count, 2);
});

test("topEmojis counts pictographs", () => {
    const stats = computeChatStats([text({ content: "🎲 bien joué 🎲 🐉" })]);
    assert.equal(stats.topEmojis[0].emoji, "🎲");
    assert.equal(stats.topEmojis[0].count, 2);
});

test("medianReplyMs measures the delay after another player spoke", () => {
    const stats = computeChatStats([
        text({ userId: "u1", username: "Alice", at: "2026-01-01T10:00:00Z" }),
        text({ userId: "u2", username: "Bob", at: "2026-01-01T10:00:30Z" }),
        text({ userId: "u1", username: "Alice", at: "2026-01-01T10:01:00Z" }),
    ]);
    const bob = stats.byPlayer.find((p) => p.username === "Bob");
    assert.equal(bob.medianReplyMs, 30_000);
});

test("each player carries a 24-slot UTC hour histogram", () => {
    const stats = computeChatStats([
        text({ at: "2026-01-01T23:00:00Z" }),
        text({ at: "2026-01-01T23:30:00Z" }),
        text({ at: "2026-01-01T09:00:00Z" }),
    ]);
    assert.equal(stats.byPlayer[0].hours.length, 24);
    assert.equal(stats.byPlayer[0].hours[23], 2);
    assert.equal(stats.byPlayer[0].hours[9], 1);
});

test("computeChatStats on an empty list returns zeroed aggregates", () => {
    const stats = computeChatStats([]);
    assert.equal(stats.totalMessages, 0);
    assert.equal(stats.medianDelayMs, 0);
    assert.deepEqual(stats.byPlayer, []);
    assert.deepEqual(stats.topWords, []);
    assert.equal(stats.heatmap.length, 7);
});

test("French elisions are split correctly, no apostrophes in topWords", () => {
    const stats = computeChatStats([
        text({ content: "j'ai vu l'auberge et qu'il partait vers l'auberge" }),
    ]);
    // auberge should appear twice
    const aubergeEntry = stats.topWords.find((w) => w.word === "auberge");
    assert.ok(aubergeEntry, "auberge should be in topWords");
    assert.equal(aubergeEntry.count, 2);
    // No word should contain an apostrophe
    const hasApostrophe = stats.topWords.some((w) => w.word.includes("'"));
    assert.ok(!hasApostrophe, "topWords should not contain apostrophes");
});

const GAME = { createdAt: new Date("2026-01-01T00:00:00Z") };

test("a gap of exactly SESSION_GAP_MS stays in the same session", () => {
    const stats = computeSessionStats([
        text({ at: "2026-01-01T10:00:00Z" }),
        text({ at: "2026-01-01T14:00:00Z" }), // pile +4 h
    ], GAME);
    assert.equal(stats.count, 1);
});

test("3h59 is one session, 4h01 is two", () => {
    const under = computeSessionStats([
        text({ at: "2026-01-01T10:00:00Z" }),
        text({ at: "2026-01-01T13:59:00Z" }),
    ], GAME);
    assert.equal(under.count, 1);

    const over = computeSessionStats([
        text({ at: "2026-01-01T10:00:00Z" }),
        text({ at: "2026-01-01T14:01:00Z" }),
    ], GAME);
    assert.equal(over.count, 2);
});

test("session durations are measured from first to last message", () => {
    const stats = computeSessionStats([
        text({ at: "2026-01-01T10:00:00Z" }),
        text({ at: "2026-01-01T12:00:00Z" }), // session 1 : 2 h
        text({ at: "2026-01-05T10:00:00Z" }),
        text({ at: "2026-01-05T14:00:00Z" }), // session 2 : 4 h
    ], GAME);
    assert.equal(stats.count, 2);
    assert.equal(stats.longestDurationMs, 4 * 3600_000);
    assert.equal(stats.avgDurationMs, 3 * 3600_000);
});

test("a lone message forms a session of zero duration", () => {
    const stats = computeSessionStats([text({ at: "2026-01-01T10:00:00Z" })], GAME);
    assert.equal(stats.count, 1);
    assert.equal(stats.longestDurationMs, 0);
});

test("campaignDurationMs runs from game creation to the last message", () => {
    const stats = computeSessionStats([
        text({ at: "2026-01-03T00:00:00Z" }),
    ], GAME);
    assert.equal(stats.campaignDurationMs, 2 * 24 * 3600_000);
});

test("computeSessionStats on an empty list returns zeroed aggregates", () => {
    const stats = computeSessionStats([], GAME);
    assert.equal(stats.count, 0);
    assert.equal(stats.avgDurationMs, 0);
    assert.equal(stats.firstActivityAt, null);
    assert.equal(stats.lastActivityAt, null);
});

test("no luck badge is awarded below the dice threshold", () => {
    const messages = [manyDice(10, "u1", "Alice", 20)];
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "blessed"), undefined);
    assert.equal(badges.find((b) => b.id === "cursed"), undefined);
});

test("luck badges are awarded above the dice threshold", () => {
    const messages = [
        manyDice(BADGE_THRESHOLDS.blessed, "u1", "Alice", 20),
        manyDice(BADGE_THRESHOLDS.blessed, "u2", "Bob", 1),
    ];
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "blessed").username, "Alice");
    assert.equal(badges.find((b) => b.id === "cursed").username, "Bob");
});

test("no chatterbox badge below the message threshold", () => {
    const messages = manyTexts(5, "u1", "Alice");
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "chatterbox"), undefined);
});

test("chatterbox goes to the most talkative player above threshold", () => {
    const messages = [
        ...manyTexts(BADGE_THRESHOLDS.chatterbox, "u1", "Alice"),
        ...manyTexts(3, "u2", "Bob", 15),
    ];
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "chatterbox").username, "Alice");
});

test("a single eligible player is blessed, never also cursed", () => {
    const messages = [manyDice(BADGE_THRESHOLDS.blessed, "u1", "Alice", 20)];
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "blessed").username, "Alice");
    assert.equal(badges.find((b) => b.id === "cursed"), undefined);
});

test("critic counts only d20 natural 20s, not max faces of other dice", () => {
    const messages = [
        // Bob lance beaucoup de d4 (max = 4), tous au max, mais ce sont des d4.
        ...Array.from({ length: 15 }, () => manyDice(BADGE_THRESHOLDS.critic + 5, "u2", "Bob", 4, "d4")),
        // Alice lance 25 d20 : 20 réguliers + 5 natural 20s.
        roll({ userId: "u1", username: "Alice", diceType: "d20", results: [20, 20, 20, 20, 20, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 1, 2, 3, 4, 19] }),
    ];
    const dice = computeDiceStats(messages);
    const bobD4Max = dice.byPlayer.find((p) => p.username === "Bob").natMax;
    assert.ok(bobD4Max >= BADGE_THRESHOLDS.critic, "Bob should have many d4 maxes");
    const badges = computeBadges(dice, computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "critic").username, "Alice");
    assert.equal(badges.find((b) => b.id === "critic").value, 5);
});

test("highRoller measures the biggest single batch, not the career total", () => {
    const messages = [
        // Bob lance beaucoup de dés, mais jamais plus de 2 d'un coup.
        ...Array.from({ length: 20 }, () => manyDice(2, "u2", "Bob", 3, "d6")),
        // Alice ne lance qu'une fois, mais 10 dés d'un coup.
        manyDice(10, "u1", "Alice", 3, "d6"),
    ];
    const dice = computeDiceStats(messages);
    assert.ok(dice.byPlayer.find((p) => p.username === "Bob").dice > 10);
    const badges = computeBadges(dice, computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "highRoller").username, "Alice");
    assert.equal(badges.find((b) => b.id === "highRoller").value, 10);
});

test("no slowpoke badge is awarded when no player has any reply delay", () => {
    // Chaque joueur franchit le seuil de messages, mais tous les messages
    // proviennent du même joueur donc aucun replyDelay n'est jamais enregistré
    // (medianReplyMs reste à 0 pour tout le monde).
    const messages = manyTexts(BADGE_THRESHOLDS.slowpoke, "u1", "Alice");
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.equal(badges.find((b) => b.id === "slowpoke"), undefined);
});

test("slowpoke is still awarded to the player with the longest real reply delay", () => {
    const messages = [
        text({ userId: "u1", username: "Alice", at: "2026-01-01T10:00:00Z" }),
        text({ userId: "u2", username: "Bob", at: "2026-01-01T10:00:10Z" }), // Bob répond vite
        ...manyTexts(BADGE_THRESHOLDS.slowpoke - 1, "u1", "Alice", 11),
        ...manyTexts(BADGE_THRESHOLDS.slowpoke - 1, "u2", "Bob", 15),
    ];
    const badges = computeBadges(computeDiceStats(messages), computeChatStats(messages));
    assert.ok(badges.find((b) => b.id === "slowpoke"));
});

test("computeGameStats output matches the documented contract's key sets", () => {
    const messages = [
        text({ userId: "u1", username: "Alice", content: "salut a tous", at: "2026-01-01T10:00:00Z" }),
        roll({ userId: "u1", username: "Alice", diceType: "d20", results: [4, 12], at: "2026-01-01T10:00:05Z" }),
        text({ userId: "u2", username: "Bob", content: "bonsoir la table", at: "2026-01-01T10:01:00Z" }),
    ];
    const stats = computeGameStats(messages, {
        _id: "g1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        players: [{ _id: "u1" }, { _id: "u2" }],
    });

    assert.deepEqual(Object.keys(stats).sort(), ["badges", "chat", "dice", "meta", "sessions"]);
    assert.deepEqual(Object.keys(stats.meta).sort(), ["gameId", "gameName", "messageCount", "playerCount", "truncated"]);
    assert.deepEqual(
        Object.keys(stats.dice).sort(),
        ["bestRoll", "breakdown", "byDiceType", "byPlayer", "d20Histogram", "totalDice", "totalPips", "totalRolls", "worstRoll"]
    );
    assert.deepEqual(
        Object.keys(stats.chat).sort(),
        ["byPlayer", "heatmap", "medianDelayMs", "topEmojis", "topWords", "totalMessages"]
    );
    assert.deepEqual(
        Object.keys(stats.sessions).sort(),
        ["avgDurationMs", "campaignDurationMs", "count", "firstActivityAt", "lastActivityAt", "longestDurationMs"]
    );
    assert.deepEqual(
        Object.keys(stats.dice.byPlayer[0]).sort(),
        ["biggestBatch", "coldStreak", "d20Dice", "d20Nat20", "dice", "luckIndex", "natMax", "natOne", "pips", "rolls", "userId", "username"]
    );
    assert.deepEqual(
        Object.keys(stats.chat.byPlayer[0]).sort(),
        ["avgLength", "diceMessages", "hours", "medianReplyMs", "messages", "share", "textMessages", "userId", "username"]
    );
});

test("computeGameStats assembles every section and reports meta", () => {
    const messages = [text({ content: "salut" }), roll({ results: [4] })];
    const stats = computeGameStats(messages, {
        _id: "g1",
        name: "La Nuit des Masques",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        players: [{ _id: "u1" }, { _id: "u2" }],
    });
    assert.equal(stats.meta.gameName, "La Nuit des Masques");
    assert.equal(stats.meta.messageCount, 2);
    assert.equal(stats.meta.playerCount, 2);
    assert.equal(stats.meta.truncated, false);
    assert.ok(stats.dice);
    assert.ok(stats.chat);
    assert.ok(stats.sessions);
    assert.ok(Array.isArray(stats.badges));
});

test("computeGameStats on a game with no message does not throw", () => {
    const stats = computeGameStats([], {
        _id: "g1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        players: [],
    });
    assert.equal(stats.meta.messageCount, 0);
    assert.deepEqual(stats.badges, []);
    assert.equal(stats.dice.totalRolls, 0);
});

test("computeGameStats sorts unsorted messages before truncating", () => {
    // Créer des messages dans un ordre désordonné
    const unsorted = [
        roll({ results: [4], at: "2026-01-01T14:00:00Z" }),
        roll({ results: [5], at: "2026-01-01T10:00:00Z" }),
        roll({ results: [6], at: "2026-01-01T12:00:00Z" }),
    ];
    const stats = computeGameStats(unsorted, {
        _id: "g1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        players: [{ _id: "u1" }],
    });
    // La première session devrait partir de 10:00 à 14:00 (2h), pas 14:00 à 10:00 (invalide).
    assert.equal(stats.sessions.count, 1);
    assert.ok(stats.sessions.longestDurationMs > 0);
    // Vérifier que les statistiques ne sont pas corrompues par le désordre
    assert.equal(stats.dice.totalRolls, 3);
});

// ── Détail des dés par joueur × type (export + tableau de la page) ─────────

const rowOf = (breakdown, userId, diceType) =>
    breakdown.find((r) => r.userId === userId && r.diceType === diceType);

test("computeDiceBreakdown lists global, per type, per player and per player × type rows", () => {
    const breakdown = computeDiceBreakdown([
        roll({ userId: "u1", username: "Alice", diceType: "d6", results: [2, 6] }),
        roll({ userId: "u1", username: "Alice", diceType: "d20", results: [20] }),
        roll({ userId: "u2", username: "Bob", diceType: "d6", results: [1] }),
    ]);

    // Ordre : global, types globaux (ordre du registre), puis chaque joueur.
    assert.deepEqual(
        breakdown.map((r) => [r.userId, r.diceType]),
        [
            [null, null], [null, "d6"], [null, "d20"],
            ["u1", null], ["u1", "d6"], ["u1", "d20"],
            ["u2", null], ["u2", "d6"],
        ]
    );

    const aliceD6 = rowOf(breakdown, "u1", "d6");
    assert.equal(aliceD6.username, "Alice");
    assert.equal(aliceD6.rolls, 1);
    assert.equal(aliceD6.dice, 2);
    assert.equal(aliceD6.average, 4);
    assert.deepEqual(aliceD6.best, { result: 6, diceType: "d6" });
    assert.deepEqual(aliceD6.worst, { result: 2, diceType: "d6" });

    const globalD6 = rowOf(breakdown, null, "d6");
    assert.equal(globalD6.username, null);
    assert.equal(globalD6.rolls, 2);
    assert.equal(globalD6.dice, 3);
    assert.equal(globalD6.average, 3);
});

test("all-types rows have no raw average, only the percentage", () => {
    const breakdown = computeDiceBreakdown([
        roll({ diceType: "d6", results: [6] }),
        roll({ diceType: "d100", results: [1] }),
    ]);
    const all = rowOf(breakdown, null, null);
    assert.equal(all.average, null);
    // d6 à 6 = 100 % du max, d100 à 1 = 0 % : moyenne 50 %.
    assert.equal(all.averagePct, 50);
});

test("averagePct is 50 on a perfectly uniform sample", () => {
    const breakdown = computeDiceBreakdown([roll({ diceType: "d6", results: [1, 2, 3, 4, 5, 6] })]);
    assert.equal(rowOf(breakdown, null, "d6").averagePct, 50);
    assert.equal(rowOf(breakdown, null, "d6").average, 3.5);
});

test("across dice types, best and worst compare in standard deviations", () => {
    // Un 80 sur d100 est moins remarquable qu'un 20 naturel sur d20.
    const breakdown = computeDiceBreakdown([
        roll({ diceType: "d100", results: [80] }),
        roll({ diceType: "d20", results: [20] }),
        // 30 sur d100 (−0,7 σ) est moins bas qu'un 1 sur d4 (−1,3 σ).
        roll({ diceType: "d100", results: [30] }),
        roll({ diceType: "d4", results: [1] }),
    ]);
    const all = rowOf(breakdown, null, null);
    assert.deepEqual(all.best, { result: 20, diceType: "d20" });
    assert.deepEqual(all.worst, { result: 1, diceType: "d4" });
});

test("computeDiceBreakdown ignores non-dice messages and unknown dice types", () => {
    const breakdown = computeDiceBreakdown([
        text({ content: "salut" }),
        roll({ diceType: "d7", results: [3] }),
    ]);
    assert.deepEqual(breakdown, []);
});

test("computeDiceStats exposes the breakdown", () => {
    const stats = computeDiceStats([roll({ results: [4] })]);
    assert.deepEqual(stats.breakdown, computeDiceBreakdown([roll({ results: [4] })]));
});
