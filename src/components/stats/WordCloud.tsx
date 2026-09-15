"use client";

import { useTranslations } from "next-intl";

type Entry = { label: string; count: number };

// Poids visuel honnête : la taille suit le compte, bornée pour rester
// lisible même quand un mot écrase largement les autres.
function weight(count: number, max: number): string {
    const ratio = max > 0 ? count / max : 0;
    if (ratio > 0.75) return "text-lg font-bold";
    if (ratio > 0.4) return "text-base font-semibold";
    return "text-xs";
}

function EntryList({ entries }: { entries: Entry[] }) {
    const max = Math.max(1, ...entries.map((e) => e.count));
    return (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {entries.map((e) => (
                <span key={e.label} className={`${weight(e.count, max)} text-foreground`}>
                    {e.label}
                    <span className="text-[10px] text-muted-foreground tabular-nums ml-0.5">({e.count})</span>
                </span>
            ))}
        </div>
    );
}

export function WordCloud({
    topWords,
    topEmojis,
}: {
    topWords: { word: string; count: number }[];
    topEmojis: { emoji: string; count: number }[];
}) {
    const t = useTranslations("game.stats.words");

    if (topWords.length === 0 && topEmojis.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topWords.length > 0 && (
                <div className="bg-background rounded-lg border p-3">
                    <h2 className="text-xs font-bold mb-2">{t("wordsTitle")}</h2>
                    <EntryList entries={topWords.map((w) => ({ label: w.word, count: w.count }))} />
                </div>
            )}
            {topEmojis.length > 0 && (
                <div className="bg-background rounded-lg border p-3">
                    <h2 className="text-xs font-bold mb-2">{t("emojisTitle")}</h2>
                    <EntryList entries={topEmojis.map((e) => ({ label: e.emoji, count: e.count }))} />
                </div>
            )}
        </div>
    );
}
