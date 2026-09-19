import { test } from "node:test";
import assert from "node:assert/strict";
// Node exécute directement le TypeScript (type stripping).
import {
    DEFAULT_COLORS,
    MAX_SAVED_COLORS,
    addSavedColor,
    highlightBackground,
    normalizeHex,
    removeSavedColor,
} from "./colors.ts";

test("normalizeHex lowercases and expands short hex", () => {
    assert.equal(normalizeHex("#ABC"), "#aabbcc");
    assert.equal(normalizeHex(" #A1B2C3 "), "#a1b2c3");
});

test("normalizeHex rejects anything that is not a hex color", () => {
    for (const bad of ["red", "#12", "#1234", "#ggg000", "", null, undefined, 42, "#abc;color:red"]) {
        assert.equal(normalizeHex(bad), null, String(bad));
    }
});

test("DEFAULT_COLORS keeps the 7 historical colors, normalized", () => {
    assert.deepEqual(
        DEFAULT_COLORS.map((c) => c.value),
        ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"],
    );
    for (const c of DEFAULT_COLORS) assert.equal(normalizeHex(c.value), c.value);
});

test("addSavedColor puts the new color first and dedupes", () => {
    assert.deepEqual(addSavedColor(["#111111", "#222222"], "#222222"), ["#222222", "#111111"]);
    assert.deepEqual(addSavedColor(["#111111"], "#ABC"), ["#aabbcc", "#111111"]);
});

test("addSavedColor ignores invalid colors and default colors", () => {
    const list = ["#111111"];
    assert.equal(addSavedColor(list, "nope"), list);
    assert.equal(addSavedColor(list, "#EF4444"), list);
});

test("addSavedColor caps the list", () => {
    const list = Array.from({ length: MAX_SAVED_COLORS }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    const result = addSavedColor(list, "#ffffff");
    assert.equal(result.length, MAX_SAVED_COLORS);
    assert.equal(result[0], "#ffffff");
    assert.equal(result.includes(list[MAX_SAVED_COLORS - 1]), false);
});

test("removeSavedColor removes a color whatever its case", () => {
    assert.deepEqual(removeSavedColor(["#aabbcc", "#111111"], "#ABC"), ["#111111"]);
});

test("highlightBackground mixes the color with transparency", () => {
    assert.equal(highlightBackground("#aabbcc"), "color-mix(in srgb, #aabbcc 35%, transparent)");
});
