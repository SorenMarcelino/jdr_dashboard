"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";
import type { GameStats } from "@/types/stats";

export function StatsWorkspace({ gameId }: { gameId: string }) {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const t = useTranslations("game.stats");

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
                {/* Task 7 remplace ce bloc par les badges et les cartes. */}
                <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(stats, null, 2)}
                </pre>
            </div>
        </div>
    );
}
