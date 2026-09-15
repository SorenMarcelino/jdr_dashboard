"use client";

import { useTranslations } from "next-intl";
import type { ChatPlayerStats } from "@/types/stats";
import { formatDuration } from "@/components/stats/StatCard";

export function ChatTable({ players }: { players: ChatPlayerStats[] }) {
    const t = useTranslations("game.stats.chatTable");
    const tDuration = useTranslations("game.stats.duration");
    const durationLabels = { d: tDuration("d"), h: tDuration("h"), min: tDuration("min") };

    return (
        <div className="bg-background rounded-lg border overflow-x-auto">
            <h2 className="text-xs font-bold p-2 pb-0">{t("title")}</h2>
            <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                        <th className="text-left font-medium p-2">{t("player")}</th>
                        <th className="text-right font-medium p-2">{t("messages")}</th>
                        <th className="text-right font-medium p-2">{t("text")}</th>
                        <th className="text-right font-medium p-2">{t("dice")}</th>
                        <th className="text-right font-medium p-2">{t("avgLength")}</th>
                        <th className="text-right font-medium p-2">{t("replyDelay")}</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((p) => (
                        <tr key={p.userId} className="border-b last:border-0">
                            <td className="p-2 font-medium">{p.username}</td>
                            <td className="p-2 text-right tabular-nums">{p.messages}</td>
                            <td className="p-2 text-right tabular-nums text-muted-foreground">{p.textMessages}</td>
                            <td className="p-2 text-right tabular-nums text-muted-foreground">{p.diceMessages}</td>
                            <td className="p-2 text-right tabular-nums">{Math.round(p.avgLength)}</td>
                            <td className="p-2 text-right tabular-nums">
                                {p.medianReplyMs > 0 ? formatDuration(p.medianReplyMs, durationLabels) : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
