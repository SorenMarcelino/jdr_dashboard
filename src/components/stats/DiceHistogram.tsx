"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";

export function DiceHistogram({ histogram }: { histogram: number[] }) {
    const t = useTranslations("game.stats.charts");
    const data = histogram.map((count, i) => ({ face: i + 1, count }));

    return (
        <div className="bg-background rounded-lg border p-3">
            <h2 className="text-xs font-bold mb-2">{t("d20Title")}</h2>
            <p className="text-[11px] text-muted-foreground mb-2">{t("d20Hint")}</p>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="face" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
