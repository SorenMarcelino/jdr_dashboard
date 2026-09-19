import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSavedColors } from "../../services/userService.mjs";

test("normalizeSavedColors lowercases and expands short hex", () => {
    assert.deepEqual(normalizeSavedColors(["#ABC", "#A1B2C3"]), ["#aabbcc", "#a1b2c3"]);
});

test("normalizeSavedColors keeps the first occurrence of duplicates", () => {
    assert.deepEqual(normalizeSavedColors(["#fff", "#123456", "#FFFFFF"]), ["#ffffff", "#123456"]);
});

test("normalizeSavedColors drops invalid values", () => {
    assert.deepEqual(normalizeSavedColors(["#123456", "nope", 42]), ["#123456"]);
});

test("normalizeSavedColors caps the list at 24 colors", () => {
    const colors = Array.from({ length: 30 }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    const result = normalizeSavedColors(colors);
    assert.equal(result.length, 24);
    assert.equal(result[0], "#000000");
});
