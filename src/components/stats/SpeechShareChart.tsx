"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import type { ChatPlayerStats } from "@/types/stats";
import { chartFill } from "@/components/stats/chartPalette";

export function SpeechShareChart({ players }: { players: ChatPlayerStats[] }) {
    const t = useTranslations("game.stats.charts");

    return (
        <div className="bg-background rounded-lg border p-3">
            <h2 className="text-xs font-bold mb-2">{t("speechTitle")}</h2>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie data={players} dataKey="messages" nameKey="username" innerRadius={40} outerRadius={70}>
                        {players.map((p, i) => (
                            <Cell key={p.userId} fill={chartFill(i)} />
                        ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
