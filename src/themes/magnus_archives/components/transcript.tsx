"use client";

import { useId, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DICE_CONFIGS, DICE_LIST, type DiceType } from "@/config/diceConfig";
import { cn } from "@/lib/utils";
import type { ChatInputProps, ChatMessageProps, DiceBarProps } from "@/themes/types";

// Transcription d'enregistrement : chaque échange est une ligne horodatée,
// le MJ parle en italique de titrage, les jets reçoivent un tampon de verdict.

function TimeStamp({ iso }: { iso: string }) {
    const format = useFormatter();
    return (
        <time dateTime={iso} className="pt-0.5 text-xs text-muted-foreground">
            {format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" })}
        </time>
    );
}

const ROW = "grid grid-cols-[3rem_minmax(0,1fr)] gap-2 border-b border-dotted border-border pb-2";

export function ArchivesTextMessage({ message, isGm }: ChatMessageProps) {
    const t = useTranslations("skins.magnus.chat");

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="min-w-0">
                <p
                    className={cn(
                        "archives-label text-[13px] font-bold uppercase",
                        isGm && "text-[color:var(--archives-signal-ink)]"
                    )}
                >
                    {isGm ? t("gm") : message.username}
                </p>
                <p
                    className={cn(
                        "break-words",
                        isGm ? "archives-display text-[17px] italic leading-snug" : "text-sm leading-relaxed"
                    )}
                >
                    {message.content}
                </p>
            </div>
        </div>
    );
}

type Verdict = "intrusion" | "minor" | "major";

// Cypher System : sur un d20 seul, 1 = intrusion du MJ, 17–18 = effet
// mineur, 19–20 = effet majeur. La difficulté n'est pas connue ici, donc pas
// de réussite/échec.
function cypherVerdict(diceType: string, results: number[]): Verdict | null {
    if (diceType !== "d20" || results.length !== 1) return null;
    const value = results[0];
    if (value === 1) return "intrusion";
    if (value >= 19) return "major";
    if (value >= 17) return "minor";
    return null;
}

export function ArchivesDiceRollMessage({ message, isGm }: ChatMessageProps) {
    const t = useTranslations("skins.magnus.chat");
    const tc = useTranslations("chat");

    const roll = message.diceRoll;
    if (!roll) return null;

    const isPercentile = DICE_CONFIGS[roll.diceType as DiceType]?.display === "percentile";
    const verdict = cypherVerdict(roll.diceType, roll.results);
    const diceLabel = roll.quantity > 1 ? `${roll.quantity}${roll.diceType}` : roll.diceType;

    let details: string | null = null;
    if (isPercentile) {
        const tens = roll.total === 100 ? 0 : Math.floor(roll.total / 10) * 10;
        const units = roll.total === 100 ? 0 : roll.total % 10;
        details = `${tc("tens")} ${tens === 0 ? "00" : tens} · ${tc("units")} ${units}`;
    } else if (roll.results.length > 1) {
        details = roll.results.join(" + ");
    }

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="flex flex-wrap items-center gap-3 border border-foreground px-3 py-2">
                <span className="archives-display min-w-[2.5rem] text-center text-4xl leading-none">{roll.total}</span>
                <div className="min-w-0 flex-1 basis-32">
                    <p className="archives-label text-sm font-bold uppercase">
                        {isGm ? t("gm") : message.username} · {diceLabel}
                    </p>
                    {details && <p className="text-xs text-muted-foreground">{details}</p>}
                </div>
                {verdict && (
                    <span
                        className={cn(
                            "archives-label border-[1.5px] px-2 py-1 text-sm font-bold uppercase",
                            verdict === "intrusion"
                                ? "border-destructive text-destructive"
                                : "border-[color:var(--archives-signal-ink)] text-[color:var(--archives-signal-ink)]"
                        )}
                    >
                        {t(`verdict.${verdict}`)}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Touches de dés façon magnétophone : un appui lance, avec le nombre de dés choisi. */
export function ArchivesDiceBar({ onRoll, disabled }: DiceBarProps) {
    const t = useTranslations("skins.magnus.chat");
    const [quantity, setQuantity] = useState(1);
    const quantityId = useId();

    const roll = (type: DiceType, max: number) => {
        onRoll(type, Math.min(quantity, max));
        setQuantity(1);
    };

    return (
        <div className="flex flex-col gap-2 border-t border-foreground px-3 pb-2 pt-3">
            <div className="flex items-center gap-2">
                <span id={quantityId} className="text-xs">{t("quantity")}</span>
                <div role="group" aria-labelledby={quantityId} className="flex items-center border border-foreground">
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={disabled || quantity <= 1}
                        aria-label={t("less")}
                        className="h-8 w-8 text-lg disabled:opacity-40"
                    >
                        −
                    </button>
                    <span className="archives-display w-7 text-center text-lg" aria-live="polite">{quantity}</span>
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
            <div role="group" aria-label={t("rollGroup")} className="flex gap-[3px]">
                {DICE_LIST.map((dice) => {
                    const q = Math.min(quantity, dice.maxQuantity);
                    return (
                        <button
                            key={dice.type}
                            type="button"
                            onClick={() => roll(dice.type, dice.maxQuantity)}
                            disabled={disabled}
                            aria-label={t("roll", { dice: q > 1 ? `${q}${dice.type}` : dice.type })}
                            className="archives-key archives-label h-11 min-w-0 flex-1 bg-[color:var(--archives-ink)] text-base font-bold text-[color:var(--archives-paper-light)] disabled:opacity-40"
                        >
                            {dice.type}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ArchivesChatInput({ onSend, disabled }: ChatInputProps) {
    const t = useTranslations("skins.magnus.chat");
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
                    className="archives-line h-10 min-w-0 flex-1 px-0.5 text-[15px] placeholder:text-muted-foreground/80"
                />
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className="archives-label h-10 shrink-0 bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                    {t("send")}
                </button>
            </div>
        </form>
    );
}
