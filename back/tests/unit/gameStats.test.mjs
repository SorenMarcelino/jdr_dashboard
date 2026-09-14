import { test } from "node:test";
import assert from "node:assert/strict";
import {
    diceMean,
    diceStdDev,
    computeDiceStats,
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
