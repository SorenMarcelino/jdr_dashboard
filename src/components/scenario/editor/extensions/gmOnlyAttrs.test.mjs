import { test } from "node:test";
import assert from "node:assert/strict";
import {
    DEFAULT_GM_EMOJI,
    GM_EMOJI_PRESETS,
    GM_LABEL_MAX,
    normalizeGmEmoji,
    normalizeGmLabel,
} from "./gmOnlyAttrs.ts";

test("normalizeGmEmoji keeps only the first grapheme", () => {
    assert.equal(normalizeGmEmoji("🔒"), "🔒");
    assert.equal(normalizeGmEmoji("  🔒 "), "🔒");
    assert.equal(normalizeGmEmoji("🧙‍♂️abc"), "🧙‍♂️");
    assert.equal(normalizeGmEmoji("🇫🇷🇬🇧"), "🇫🇷");
});

test("normalizeGmEmoji returns null for empty or non-string values", () => {
    for (const bad of ["", "   ", null, undefined, 42]) {
        assert.equal(normalizeGmEmoji(bad), null, String(bad));
    }
});

test("normalizeGmLabel trims and nulls empty labels", () => {
    assert.equal(normalizeGmLabel("  Secret du MJ  "), "Secret du MJ");
    assert.equal(normalizeGmLabel("   "), null);
    assert.equal(normalizeGmLabel(""), null);
    assert.equal(normalizeGmLabel(null), null);
});

test("normalizeGmLabel caps the label in code points", () => {
    assert.equal(normalizeGmLabel("a".repeat(50)), "a".repeat(GM_LABEL_MAX));
    assert.equal(normalizeGmLabel("🐉".repeat(45)), "🐉".repeat(GM_LABEL_MAX));
});

test("GM_EMOJI_PRESETS starts with the default emoji and holds 12 graphemes", () => {
    assert.equal(GM_EMOJI_PRESETS[0], DEFAULT_GM_EMOJI);
    assert.equal(GM_EMOJI_PRESETS.length, 12);
    for (const e of GM_EMOJI_PRESETS) assert.equal(normalizeGmEmoji(e), e);
});
