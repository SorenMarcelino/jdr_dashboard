"use client";

import { useLocale, useTranslations } from "next-intl";
import type { RollRecord } from "@/types/stats";

function Record({ record }: { record: RollRecord }) {
    const locale = useLocale();
    const date = new Date(record.createdAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{record.username}</span>
            <span className="text-lg font-bold tabular-nums">
                {record.diceType} — {record.result}
            </span>
            <span className="text-[11px] text-muted-foreground">{date}</span>
        </div>
    );
}

export function RecordsCard({ bestRoll, worstRoll }: { bestRoll: RollRecord | null; worstRoll: RollRecord | null }) {
    const t = useTranslations("game.stats.records");

    // Aucun dé lancé sur toute la partie : rien à montrer.
    if (!bestRoll && !worstRoll) return null;

    return (
        <div className="bg-background rounded-lg border p-3">
            <h2 className="text-xs font-bold mb-2">{t("title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bestRoll && (
                    <div>
                        <span className="text-[11px] text-muted-foreground">{t("best")}</span>
                        <Record record={bestRoll} />
                    </div>
                )}
                {worstRoll && (
                    <div>
                        <span className="text-[11px] text-muted-foreground">{t("worst")}</span>
                        <Record record={worstRoll} />
                    </div>
                )}
            </div>
        </div>
    );
}
