import { test } from "node:test";
import assert from "node:assert/strict";
import { DICE_REGISTRY, rollDice } from "../../config/diceRegistry.mjs";

test("rollDice returns results within the dice face range", () => {
    for (const [type, config] of Object.entries(DICE_REGISTRY)) {
        const qty = Math.min(config.maxQuantity, 3);
        const { results, total } = rollDice(type, qty);
        assert.equal(results.length, qty);
        for (const r of results) {
            assert.ok(Number.isInteger(r), `${type}: result is integer`);
            assert.ok(r >= 1 && r <= config.faces, `${type}: ${r} in [1, ${config.faces}]`);
        }
        assert.equal(total, results.reduce((a, b) => a + b, 0));
    }
});

test("rollDice rejects unknown dice type", () => {
    assert.throws(() => rollDice("d3", 1), /Unknown dice type/);
});

test("rollDice rejects quantity above maxQuantity", () => {
    assert.throws(() => rollDice("d6", 999), /Invalid quantity/);
});

test("rollDice rejects quantity below 1", () => {
    assert.throws(() => rollDice("d6", 0), /Invalid quantity/);
});
