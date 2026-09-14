"use client";

import { useTranslations } from "next-intl";

// La heatmap arrive en UTC. On la fait pivoter du décalage local, en reportant
// le débordement sur le jour voisin quand le décalage franchit minuit. Le
// décalage est arrondi à l'heure pleine : les fuseaux à la demi-heure dérivent
// d'au plus 30 min, acceptable pour une grille horaire.
function toLocal(utc: number[][]): number[][] {
    const offsetHours = -Math.round(new Date().getTimezoneOffset() / 60);
    const local = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const shifted = hour + offsetHours;
            const localHour = ((shifted % 24) + 24) % 24;
            const dayShift = Math.floor(shifted / 24);
            const localDay = ((day + dayShift) % 7 + 7) % 7;
            local[localDay][localHour] += utc[day][hour];
        }
    }
    return local;
}

export function ActivityHeatmap({ heatmap }: { heatmap: number[][] }) {
    const t = useTranslations("game.stats.heatmap");
    const local = toLocal(heatmap);
    const max = Math.max(1, ...local.flat());
    // L'ordre d'affichage commence le lundi ; getUTCDay() met dimanche à 0.
    const order = [1, 2, 3, 4, 5, 6, 0];
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    return (
        <div className="bg-background rounded-lg border p-3 overflow-x-auto">
            <h2 className="text-xs font-bold mb-2">{t("title")}</h2>
            <div className="min-w-[520px]">
                {order.map((day) => (
                    <div key={day} className="flex items-center gap-1 mb-0.5">
                        <span className="w-8 shrink-0 text-[10px] text-muted-foreground">
                            {t(dayKeys[day])}
                        </span>
                        <div className="flex gap-0.5">
                            {local[day].map((count, hour) => (
                                <div
                                    key={hour}
                                    title={`${hour}h — ${count}`}
                                    className="w-4 h-4 rounded-sm"
                                    style={{
                                        backgroundColor:
                                            count === 0
                                                ? "hsl(var(--muted))"
                                                : `hsl(var(--chart-1) / ${0.15 + 0.85 * (count / max)})`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="flex items-center gap-1 mt-1">
                    <span className="w-8 shrink-0" />
                    <div className="flex gap-0.5">
                        {Array.from({ length: 24 }, (_, h) => (
                            <span key={h} className="w-4 text-[8px] text-muted-foreground text-center">
                                {h % 6 === 0 ? h : ""}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
