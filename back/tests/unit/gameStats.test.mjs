import { test } from "node:test";
import assert from "node:assert/strict";
import {
    diceMean,
    diceStdDev,
    computeDiceStats,
    SESSION_GAP_MS,
    median,
    computeChatStats,
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
