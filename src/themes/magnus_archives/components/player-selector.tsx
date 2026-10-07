"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PlayerSelectorProps } from "@/themes/types";

/** Onglets de chemise : une fiche par joueur, l'onglet actif prend la matière papier. */
export function ArchivesPlayerSelector({ players, selectedId, onSelect }: PlayerSelectorProps) {
    const t = useTranslations("skins.magnus");

    return (
        <div role="group" aria-label={t("chooseSheet")} className="flex items-end gap-[3px]">
            {players.map((player) => {
                const active = player._id === selectedId;
                return (
                    <button
                        key={player._id}
                        type="button"
                        onClick={() => onSelect(player._id)}
                        aria-pressed={active}
                        className={cn(
                            "archives-tab archives-label min-h-9 whitespace-nowrap px-5 pb-1.5 pt-2 text-sm font-semibold transition-colors",
                            active
                                ? "bg-card"
                                : "bg-[color:var(--archives-tab)] text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {player.username}
                    </button>
                );
            })}
        </div>
    );
}
