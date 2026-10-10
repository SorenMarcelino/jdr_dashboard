"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PlayerSelectorProps } from "@/themes/types";

/** Une fiche par joueur : boutons de laiton, le joueur affiché reste enfoncé. */
export function HydrePlayerSelector({ players, selectedId, onSelect }: PlayerSelectorProps) {
    const t = useTranslations("skins.hydre");

    return (
        <div role="group" aria-label={t("chooseSheet")} className="flex items-end gap-1">
            {players.map((player) => {
                const active = player._id === selectedId;
                return (
                    <button
                        key={player._id}
                        type="button"
                        onClick={() => onSelect(player._id)}
                        aria-pressed={active}
                        className={cn(
                            "hydre-display min-h-8 whitespace-nowrap rounded-sm px-3 text-sm transition-colors",
                            active
                                ? "hydre-brass"
                                : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {player.username}
                    </button>
                );
            })}
        </div>
    );
}
