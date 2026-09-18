"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { DiceBreakdownRow } from "@/types/stats";
import { DICE_BREAKDOWN_COLUMNS, type BreakdownColumn } from "@/lib/statsExport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Valeur du sélecteur pour « tous les joueurs » (Radix refuse la chaîne vide).
const ALL = "all";

const TABLE_COLUMNS = DICE_BREAKDOWN_COLUMNS.filter((c) => c.inTable !== false);

export function DiceBreakdownTable({ rows }: { rows: DiceBreakdownRow[] }) {
    const t = useTranslations("game.stats.breakdown");
    const locale = useLocale();
    const [selected, setSelected] = useState(ALL);

    // Partie sans aucun jet de dés : rien à détailler.
    if (rows.length === 0) return null;

    const players = rows.filter((r) => r.userId !== null && r.diceType === null);
    const userId = selected === ALL ? null : selected;
    const visible = rows.filter((r) => r.userId === userId);

    const cell = (column: BreakdownColumn, row: DiceBreakdownRow) => {
        if (column.display) return column.display(row, t);
        const value = column.value(row, t);
        if (value === null) return "—";
        if (typeof value === "number") {
            return value.toLocaleString(locale, { maximumFractionDigits: column.decimals ?? 0 });
        }
        return value;
    };

    return (
        <div className="bg-background rounded-lg border overflow-x-auto">
            <div className="flex items-center justify-between gap-2 p-2 pb-0">
                <h2 className="text-xs font-bold">{t("title")}</h2>
                <Select value={selected} onValueChange={setSelected}>
                    <SelectTrigger className="h-7 w-auto min-w-40 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>{t("allPlayers")}</SelectItem>
                        {players.map((p) => (
                            <SelectItem key={p.userId} value={p.userId!}>
                                {p.username}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                        {TABLE_COLUMNS.map((c, i) => (
                            <th key={c.id} className={`font-medium p-2 ${i === 0 ? "text-left" : "text-right"}`}>
                                {t(`columns.${c.id}`)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visible.map((row) => (
                        <tr
                            key={row.diceType ?? ALL}
                            className={`border-b last:border-0 ${row.diceType === null ? "font-medium" : ""}`}
                        >
                            {TABLE_COLUMNS.map((c, i) => (
                                <td key={c.id} className={`p-2 ${i === 0 ? "" : "text-right tabular-nums"}`}>
                                    {cell(c, row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground p-2 pt-1">{t("hint")}</p>
        </div>
    );
}
