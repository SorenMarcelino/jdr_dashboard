"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";
import type { GameStats } from "@/types/stats";
import { StatCard, formatDuration } from "@/components/stats/StatCard";
import { BadgeShowcase } from "@/components/stats/BadgeShowcase";
import { LuckTable } from "@/components/stats/LuckTable";
import { DiceHistogram } from "@/components/stats/DiceHistogram";
import { DiceTypeChart } from "@/components/stats/DiceTypeChart";
import { SpeechShareChart } from "@/components/stats/SpeechShareChart";
import { ActivityHeatmap } from "@/components/stats/ActivityHeatmap";
import { RecordsCard } from "@/components/stats/RecordsCard";
import { WordCloud } from "@/components/stats/WordCloud";
import { ChatTable } from "@/components/stats/ChatTable";

export function StatsWorkspace({ gameId }: { gameId: string }) {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const t = useTranslations("game.stats");
    const durationLabels = { d: t("duration.d"), h: t("duration.h"), min: t("duration.min") };

    useEffect(() => {
        axios
            .get(`${API_URL}/games/${gameId}/stats`, { withCredentials: true })
            .then((res) => {
                if (res.data.success) setStats(res.data.stats);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [gameId]);

    const header = (
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b bg-background">
            <Link
                href={`/game/${gameId}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t("back")}
            </Link>
            <h1 className="text-sm font-bold">{t("title")}</h1>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col h-svh bg-muted">
                {header}
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    {t("loading")}
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col h-svh bg-muted">
                {header}
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    {t("error")}
                </div>
            </div>
        );
    }

    if (stats.meta.messageCount === 0) {
        return (
            <div className="flex flex-col h-svh bg-muted">
                {header}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm font-medium">{t("empty")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-svh bg-muted">
            {header}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <BadgeShowcase badges={stats.badges} players={stats.chat.byPlayer} />

                {stats.meta.truncated && (
                    <p className="text-[11px] text-muted-foreground bg-background rounded-lg border p-2">
                        {t("truncated")}
                    </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label={t("cards.rolls")} value={String(stats.dice.totalRolls)} hint={t("cards.rollsHint", { dice: stats.dice.totalDice })} />
                    <StatCard label={t("cards.pips")} value={stats.dice.totalPips.toLocaleString()} />
                    <StatCard label={t("cards.sessions")} value={String(stats.sessions.count)} hint={formatDuration(stats.sessions.avgDurationMs, durationLabels)} />
                    <StatCard label={t("cards.campaign")} value={formatDuration(stats.sessions.campaignDurationMs, durationLabels)} />
                    <StatCard label={t("cards.medianDelay")} value={formatDuration(stats.chat.medianDelayMs, durationLabels)} />
                </div>

                <LuckTable players={stats.dice.byPlayer} />

                <RecordsCard bestRoll={stats.dice.bestRoll} worstRoll={stats.dice.worstRoll} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DiceHistogram histogram={stats.dice.d20Histogram} />
                    <DiceTypeChart data={stats.dice.byDiceType} />
                    <SpeechShareChart players={stats.chat.byPlayer} />
                </div>

                <WordCloud topWords={stats.chat.topWords} topEmojis={stats.chat.topEmojis} />

                <ChatTable players={stats.chat.byPlayer} />

                <ActivityHeatmap heatmap={stats.chat.heatmap} />
            </div>
        </div>
    );
}
