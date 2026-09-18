import { test } from "node:test";
import assert from "node:assert/strict";
// Node exécute directement le TypeScript (type stripping) : pas d'outillage
// de test côté frontend à maintenir.
import {
    DICE_BREAKDOWN_COLUMNS,
    EXPORT_FORMATS,
    buildCsv,
    csvDialect,
    exportFileName,
} from "./statsExport.ts";

// Traducteur factice : renvoie la clé, pour vérifier quelles clés sont lues.
const t = (key) => `[${key}]`;

const row = (over = {}) => ({
    userId: "u1",
    username: "Alice",
    diceType: "d20",
    rolls: 3,
    dice: 4,
    average: 11.25,
    averagePct: 53.94736,
    best: { result: 20, diceType: "d20" },
    worst: { result: 1, diceType: "d20" },
    ...over,
});

const stats = (breakdown = [row()]) => ({
    meta: { gameId: "g1", gameName: "La Nuit des Masques", playerCount: 2, messageCount: 10, truncated: false },
    dice: { breakdown },
});

const lines = (csv) => csv.replace(/^﻿/, "").split("\r\n");

test("csvDialect follows the interface language", () => {
    assert.deepEqual(csvDialect("fr"), { separator: ";", decimal: "," });
    assert.deepEqual(csvDialect("en"), { separator: ",", decimal: "." });
});

test("CSV starts with a BOM and has one header plus one line per row", () => {
    const csv = buildCsv([row(), row({ userId: "u2", username: "Bob" })], t, "fr");
    assert.ok(csv.startsWith("﻿"), "BOM pour qu'Excel lise l'UTF-8");
    assert.equal(lines(csv).length, 3);
});

test("CSV header lists every column label, in registry order", () => {
    const [header] = lines(buildCsv([row()], t, "fr"));
    assert.deepEqual(
        header.split(";"),
        DICE_BREAKDOWN_COLUMNS.map((c) => `[columns.${c.id}]`)
    );
});

test("CSV numbers use the locale decimal mark and the column precision", () => {
    const fr = lines(buildCsv([row()], t, "fr"))[1].split(";");
    const en = lines(buildCsv([row()], t, "en"))[1].split(",");
    const idx = (id) => DICE_BREAKDOWN_COLUMNS.findIndex((c) => c.id === id);

    assert.equal(fr[idx("average")], "11,25");
    assert.equal(fr[idx("averagePct")], "53,9");
    assert.equal(en[idx("average")], "11.25");
    assert.equal(en[idx("averagePct")], "53.9");
});

test("aggregate rows use translated labels and an empty raw average", () => {
    const line = lines(buildCsv([row({ userId: null, username: null, diceType: null, average: null })], t, "fr"))[1];
    const cells = line.split(";");
    const idx = (id) => DICE_BREAKDOWN_COLUMNS.findIndex((c) => c.id === id);

    assert.equal(cells[idx("player")], "[allPlayers]");
    assert.equal(cells[idx("diceType")], "[allTypes]");
    assert.equal(cells[idx("average")], "");
});

test("CSV quotes cells containing the separator, quotes or newlines", () => {
    const csv = buildCsv([row({ username: 'Le "Grand"; Nain' })], t, "fr");
    assert.ok(lines(csv)[1].startsWith('"Le ""Grand""; Nain";'));
});

test("CSV neutralises usernames that a spreadsheet would run as formulas", () => {
    const csv = buildCsv([row({ username: "=HYPERLINK(\"x\")" })], t, "en");
    assert.ok(lines(csv)[1].startsWith(`"'=HYPERLINK(""x"")"`));
});

test("JSON export carries the full stats and the export date", () => {
    const now = new Date("2026-09-19T10:00:00Z");
    const json = JSON.parse(EXPORT_FORMATS.json.serialize({ stats: stats(), t, locale: "fr", now }));
    assert.equal(json.exportedAt, "2026-09-19T10:00:00.000Z");
    assert.deepEqual(json.stats, stats());
});

test("CSV export format serializes the dice breakdown", () => {
    const now = new Date("2026-09-19T10:00:00Z");
    const csv = EXPORT_FORMATS.csv.serialize({ stats: stats(), t, locale: "fr", now });
    assert.equal(csv, buildCsv(stats().dice.breakdown, t, "fr"));
});

test("exportFileName slugs the game name and dates the file", () => {
    const now = new Date(2026, 8, 19, 10, 0, 0);
    assert.equal(exportFileName(stats(), "csv", now), "stats-la-nuit-des-masques-2026-09-19.csv");
    assert.equal(exportFileName(stats(), "json", now), "stats-la-nuit-des-masques-2026-09-19.json");
});

test("exportFileName falls back to the game id without a usable name", () => {
    const s = stats();
    s.meta.gameName = "🎲🎲";
    assert.equal(exportFileName(s, "csv", new Date(2026, 0, 2)), "stats-g1-2026-01-02.csv");
});
