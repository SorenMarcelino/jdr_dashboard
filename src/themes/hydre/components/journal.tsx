"use client";

import { useId, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DICE_CONFIGS, DICE_LIST, type DiceType } from "@/config/diceConfig";
import { cn } from "@/lib/utils";
import type { ChatInputProps, ChatMessageProps, DiceBarProps } from "@/themes/types";
import { GearMedallion } from "./ornaments";

// Carnet de chasse : chaque échange est une entrée du journal de l'expédition,
// le MJ narre en italique, les jets s'inscrivent dans un médaillon de laiton.

function TimeStamp({ iso }: { iso: string }) {
    const format = useFormatter();
    return (
        <time dateTime={iso} className="pt-0.5 text-xs text-muted-foreground">
            {format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" })}
        </time>
    );
}

const ROW = "grid grid-cols-[3rem_minmax(0,1fr)] gap-2 border-b border-[color:var(--hydre-brass-dark)]/25 pb-2";

export function HydreTextMessage({ message, isGm }: ChatMessageProps) {
    const t = useTranslations("skins.hydre.chat");

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="min-w-0">
                <p className={cn("hydre-display text-[13px] uppercase tracking-wide", isGm ? "text-[color:var(--hydre-plaque)]" : "text-[color:var(--hydre-slate)]")}>
                    {isGm ? t("gm") : message.username}
                </p>
                <p className={cn("break-words leading-snug", isGm ? "text-[17px] italic" : "text-[15px]")}>{message.content}</p>
            </div>
        </div>
    );
}

type Verdict = "critSuccess" | "critFailure";

// HYDRE : sur 1d100, 01–05 = succès critique, 96–00 = échec critique.
// Le score visé n'est pas connu ici, donc pas de réussite/échec simple.
function hydreVerdict(diceType: string, total: number): Verdict | null {
    if (diceType !== "d100") return null;
    if (total <= 5) return "critSuccess";
    if (total >= 96) return "critFailure";
    return null;
}

export function HydreDiceRollMessage({ message, isGm }: ChatMessageProps) {
    const t = useTranslations("skins.hydre.chat");

    const roll = message.diceRoll;
    if (!roll) return null;

    const isPercentile = DICE_CONFIGS[roll.diceType as DiceType]?.display === "percentile";
    const verdict = hydreVerdict(roll.diceType, roll.total);
    const diceLabel = roll.quantity > 1 ? `${roll.quantity}${roll.diceType}` : roll.diceType;

    const details = !isPercentile && roll.results.length > 1 ? roll.results.join(" + ") : null;

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="flex flex-wrap items-center gap-3">
                <GearMedallion className="w-16 shrink-0">
                    <span className="hydre-hand text-3xl leading-none text-[color:var(--hydre-slate)]">{roll.total}</span>
                </GearMedallion>
                <div className="min-w-0 flex-1 basis-28">
                    <p className="hydre-display text-sm uppercase tracking-wide">
                        {isGm ? t("gm") : message.username} · {diceLabel}
                    </p>
                    {details && <p className="text-xs text-muted-foreground">{details}</p>}
                </div>
                {verdict && (
                    <span
                        className={cn(
                            "hydre-display rounded-sm border-[1.5px] px-2 py-1 text-sm uppercase",
                            verdict === "critFailure"
                                ? "border-destructive text-destructive"
                                : "border-[color:var(--hydre-slate)] text-[color:var(--hydre-slate)]"
                        )}
                    >
                        {t(`verdict.${verdict}`)}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Rangée de boutons de laiton : un appui lance, avec le nombre de dés choisi. */
export function HydreDiceBar({ onRoll, disabled }: DiceBarProps) {
    const t = useTranslations("skins.hydre.chat");
    const [quantity, setQuantity] = useState(1);
    const quantityId = useId();

    const roll = (type: DiceType, max: number) => {
        onRoll(type, Math.min(quantity, max));
        setQuantity(1);
    };

    return (
        <div className="flex flex-col gap-2 border-t border-[color:var(--hydre-brass-dark)]/40 px-3 pb-2 pt-3">
            <div className="flex items-center gap-2">
                <span id={quantityId} className="text-xs">{t("quantity")}</span>
                <div role="group" aria-labelledby={quantityId} className="flex items-center rounded-sm border border-[color:var(--hydre-brass-dark)]/60">
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={disabled || quantity <= 1}
                        aria-label={t("less")}
                        className="h-8 w-8 text-lg disabled:opacity-40"
                    >
                        −
                    </button>
                    <span className="hydre-hand w-7 text-center text-xl text-[color:var(--hydre-slate)]" aria-live="polite">{quantity}</span>
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        disabled={disabled || quantity >= 10}
                        aria-label={t("more")}
                        className="h-8 w-8 text-lg disabled:opacity-40"
                    >
                        +
                    </button>
                </div>
            </div>
            <div role="group" aria-label={t("rollGroup")} className="flex gap-1">
                {DICE_LIST.map((dice) => {
                    const q = Math.min(quantity, dice.maxQuantity);
                    return (
                        <button
                            key={dice.type}
                            type="button"
                            onClick={() => roll(dice.type, dice.maxQuantity)}
                            disabled={disabled}
                            aria-label={t("roll", { dice: q > 1 ? `${q}${dice.type}` : dice.type })}
                            className={cn(
                                "hydre-brass hydre-display h-10 min-w-0 flex-1 rounded-sm text-base disabled:opacity-40",
                                // Le d100 est le dé du système : il est mis en avant.
                                dice.type === "d100" && "flex-[1.4] ring-1 ring-[color:var(--hydre-plaque)]"
                            )}
                        >
                            {dice.type}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function HydreChatInput({ onSend, disabled }: ChatInputProps) {
    const t = useTranslations("skins.hydre.chat");
    const [value, setValue] = useState("");
    const inputId = useId();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setValue("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-1 px-3 pb-3 pt-1">
            <label htmlFor={inputId} className="text-xs">{t("inputLabel")}</label>
            <div className="flex items-end gap-2">
                <input
                    id={inputId}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={disabled}
                    placeholder={t("placeholder")}
                    className="hydre-line h-10 min-w-0 flex-1 px-0.5 text-[16px] placeholder:text-muted-foreground/80"
                />
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className="hydre-brass hydre-display h-10 shrink-0 rounded-sm px-4 text-sm uppercase disabled:opacity-40"
                >
                    {t("send")}
                </button>
            </div>
        </form>
    );
}
