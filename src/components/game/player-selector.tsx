"use client";

import type { PlayerSelectorProps } from "@/themes/types";

/** Sélecteur de fiche joueur côté MJ (skin par défaut). */
export function PlayerSelector({ players, selectedId, onSelect }: PlayerSelectorProps) {
    return (
        <div className="flex gap-1">
            {players.map((player) => (
                <button
                    key={player._id}
                    onClick={() => onSelect(player._id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                        ${selectedId === player._id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-muted-foreground/30 hover:border-primary"
                        }`}
                >
                    {player.username}
                </button>
            ))}
        </div>
    );
}
