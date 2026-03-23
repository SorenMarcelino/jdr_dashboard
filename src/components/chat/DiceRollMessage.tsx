"use client";

import type { ChatMessage } from "@/contexts/SocketContext";
import { DICE_CONFIGS, type DiceType } from "@/config/diceConfig";
import { Dices } from "lucide-react";

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function DiceRollMessage({ message }: { message: ChatMessage; isOwn: boolean }) {
    const roll = message.diceRoll;
    if (!roll) return null;

    const config = DICE_CONFIGS[roll.diceType as DiceType];
    const colorClass = config?.color ?? "text-foreground";

    const isPercentile = config?.display === "percentile";

    return (
        <div className="self-center w-full max-w-[90%]">
            <div className="rounded-lg border bg-card/50 px-3 py-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                    <Dices className={`w-3.5 h-3.5 ${colorClass}`} />
                    <span className="font-medium">{message.username}</span>
                    <span className="text-muted-foreground">a lancé</span>
                    <span className={`font-bold ${colorClass}`}>
                        {roll.quantity > 1 ? `${roll.quantity}${roll.diceType}` : roll.diceType}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">{formatTime(message.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isPercentile ? (
                        <>
                            <span className="text-xs text-muted-foreground">
                                {(() => {
                                    const tens = roll.total === 100 ? 0 : Math.floor(roll.total / 10) * 10;
                                    const units = roll.total === 100 ? 0 : roll.total % 10;
                                    return `dizaines: ${tens === 0 ? "00" : tens} | unités: ${units}`;
                                })()}
                            </span>
                        </>
                    ) : (
                        <div className="flex gap-1 flex-wrap">
                            {roll.results.map((r, i) => (
                                <span key={i} className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold bg-muted ${colorClass}`}>
                                    {r}
                                </span>
                            ))}
                        </div>
                    )}
                    <span className="ml-auto text-lg font-bold">{roll.total}</span>
                </div>
            </div>
        </div>
    );
}
