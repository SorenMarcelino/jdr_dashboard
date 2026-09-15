"use client";

import { useTranslations } from "next-intl";
import type { DicePlayerStats } from "@/types/stats";

export function LuckTable({ players }: { players: DicePlayerStats[] }) {
    const t = useTranslations("game.stats.luck");

    // Sous 50 dés (le seuil des badges de chance), |z| > 1,5 se produit chez
    // ~13 % des joueurs parfaitement équitables : colorer l'indice à cet
    // effectif ferait passer du bruit pour un constat. On garde le nombre
    // affiché, mais en couleur neutre en dessous du seuil.
    const tone = (z: number, dice: number) =>
        dice < 50 ? "text-foreground" : z > 1.5 ? "text-chart-2" : z < -1.5 ? "text-chart-1" : "text-foreground";

    return (
        <div className="bg-background rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                        <th className="text-left font-medium p-2">{t("player")}</th>
                        <th className="text-right font-medium p-2">{t("dice")}</th>
                        <th className="text-right font-medium p-2">{t("index")}</th>
                        <th className="text-right font-medium p-2">{t("natMax")}</th>
                        <th className="text-right font-medium p-2">{t("natOne")}</th>
                        <th className="text-right font-medium p-2">{t("coldStreak")}</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((p) => (
                        <tr key={p.userId} className="border-b last:border-0">
                            <td className="p-2 font-medium">{p.username}</td>
                            <td className="p-2 text-right tabular-nums text-muted-foreground">{p.dice}</td>
                            <td className={`p-2 text-right tabular-nums font-bold ${tone(p.luckIndex, p.dice)}`}>
                                {p.luckIndex > 0 ? "+" : ""}{p.luckIndex.toFixed(2)}
                            </td>
                            <td className="p-2 text-right tabular-nums">{p.natMax}</td>
                            <td className="p-2 text-right tabular-nums">{p.natOne}</td>
                            <td className="p-2 text-right tabular-nums">{p.coldStreak}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground p-2 border-t">{t("caveat")}</p>
        </div>
    );
}
