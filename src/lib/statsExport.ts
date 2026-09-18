import type { DiceBreakdownRow, GameStats } from "@/types/stats";

// ─────────────────────────────────────────────────────────────────────────
// Export des statistiques d'une partie (CSV / JSON), généré côté client à
// partir des stats déjà chargées par la page.
//
// Deux registres pilotent tout :
//   - DICE_BREAKDOWN_COLUMNS : ajouter une colonne ici l'ajoute au CSV ET au
//     tableau « Dés par joueur et par type » de la page ;
//   - EXPORT_FORMATS : ajouter un format ici l'ajoute au menu Exporter.
//
// Tout est pur sauf downloadStats (DOM), ce qui garde le module testable par
// `npm run test:unit` sans navigateur.
// ─────────────────────────────────────────────────────────────────────────

/** Traducteur scopé sur `game.stats.breakdown`. */
export type Translate = (key: string) => string;

export type CellValue = string | number | null;

export type BreakdownColumn = {
    /** Identifiant stable ; libellé lu sous `columns.<id>`. */
    id: string;
    /** Valeur brute, utilisée par l'export. */
    value: (row: DiceBreakdownRow, t: Translate) => CellValue;
    /** Nombre de décimales pour les valeurs numériques. */
    decimals?: number;
    /** Affichage dans le tableau de la page, si différent de `value`. */
    display?: (row: DiceBreakdownRow, t: Translate) => string;
    /** false = colonne présente dans l'export seulement. */
    inTable?: boolean;
};

// En tableau, une face « tous types » n'a de sens qu'avec son dé : 20 (d20).
const faceLabel = (row: DiceBreakdownRow, face: DiceBreakdownRow["best"]) =>
    row.diceType === null ? `${face.result} (${face.diceType})` : String(face.result);

export const DICE_BREAKDOWN_COLUMNS: BreakdownColumn[] = [
    // Le tableau de la page filtre déjà par joueur : colonne redondante.
    { id: "player", value: (r, t) => r.username ?? t("allPlayers"), inTable: false },
    { id: "diceType", value: (r, t) => r.diceType ?? t("allTypes") },
    { id: "rolls", value: (r) => r.rolls },
    { id: "dice", value: (r) => r.dice },
    { id: "average", value: (r) => r.average, decimals: 2 },
    { id: "averagePct", value: (r) => r.averagePct, decimals: 1 },
    { id: "best", value: (r) => r.best.result, display: (r) => faceLabel(r, r.best) },
    { id: "bestDie", value: (r) => r.best.diceType, inTable: false },
    { id: "worst", value: (r) => r.worst.result, display: (r) => faceLabel(r, r.worst) },
    { id: "worstDie", value: (r) => r.worst.diceType, inTable: false },
];

export const formatNumber = (n: number, decimals: number, decimalMark: string) =>
    String(Number(n.toFixed(decimals))).replace(".", decimalMark);

// ── CSV ──────────────────────────────────────────────────────────────────

/** Séparateur attendu par Excel selon la langue : `;` là où la virgule est décimale. */
export function csvDialect(locale: string) {
    return locale.startsWith("fr")
        ? { separator: ";", decimal: "," }
        : { separator: ",", decimal: "." };
}

// Un tableur exécute une cellule commençant par = + - @ comme une formule ;
// les pseudos étant libres, on les neutralise par une apostrophe.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvCell(value: CellValue, decimals: number, dialect: ReturnType<typeof csvDialect>) {
    if (value === null) return "";
    if (typeof value === "number") return formatNumber(value, decimals, dialect.decimal);

    const text = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
    const needsQuotes = text.includes(dialect.separator) || /["\r\n]/.test(text) || text !== value;
    return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(rows: DiceBreakdownRow[], t: Translate, locale: string) {
    const dialect = csvDialect(locale);
    const header = DICE_BREAKDOWN_COLUMNS.map((c) => csvCell(t(`columns.${c.id}`), 0, dialect));
    const body = rows.map((row) =>
        DICE_BREAKDOWN_COLUMNS.map((c) => csvCell(c.value(row, t), c.decimals ?? 0, dialect))
    );
    // BOM : sans lui, Excel lit le fichier en Windows-1252 et casse les accents.
    return "﻿" + [header, ...body].map((cells) => cells.join(dialect.separator)).join("\r\n");
}

// ── Formats ──────────────────────────────────────────────────────────────

export type ExportContext = {
    stats: GameStats;
    t: Translate;
    locale: string;
    now: Date;
};

export type ExportFormat = {
    extension: string;
    mimeType: string;
    serialize: (ctx: ExportContext) => string;
};

export const EXPORT_FORMATS = {
    csv: {
        extension: "csv",
        mimeType: "text/csv;charset=utf-8",
        serialize: ({ stats, t, locale }) => buildCsv(stats.dice.breakdown, t, locale),
    },
    json: {
        extension: "json",
        mimeType: "application/json",
        serialize: ({ stats, now }) => JSON.stringify({ exportedAt: now.toISOString(), stats }, null, 2),
    },
} satisfies Record<string, ExportFormat>;

export type ExportFormatId = keyof typeof EXPORT_FORMATS;

const slugify = (s: string) =>
    s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const localDate = (d: Date) =>
    [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("-");

export function exportFileName(stats: GameStats, formatId: ExportFormatId, now: Date) {
    const name = slugify(stats.meta.gameName) || stats.meta.gameId;
    return `stats-${name}-${localDate(now)}.${EXPORT_FORMATS[formatId].extension}`;
}

/** Déclenche le téléchargement du fichier dans le navigateur. */
export function downloadStats(formatId: ExportFormatId, ctx: ExportContext) {
    const format: ExportFormat = EXPORT_FORMATS[formatId];
    const blob = new Blob([format.serialize(ctx)], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(ctx.stats, formatId, ctx.now);
    link.click();
    // Révoquer dans la foulée peut couper le téléchargement sous Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
