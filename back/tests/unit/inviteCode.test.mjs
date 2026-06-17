import { test } from "node:test";
import assert from "node:assert/strict";
import { generateInviteCode } from "../../models/GameModel.mjs";

test("generateInviteCode has the requested length and safe alphabet", () => {
    const code = generateInviteCode();
    assert.equal(code.length, 6);
    // Pas de caractères ambigus (0, O, 1, I)
    assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
});

test("generateInviteCode respects custom length", () => {
    assert.equal(generateInviteCode(10).length, 10);
});

test("generateInviteCode is reasonably unique", () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateInviteCode()));
    // Tolérance large : on s'assure surtout qu'il n'y a pas de constante.
    assert.ok(codes.size > 990, `expected near-unique codes, got ${codes.size}/1000`);
});
