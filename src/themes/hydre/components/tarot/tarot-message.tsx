"use client";

import { useTranslations } from "next-intl";
import { TAROT_SPREADS } from "@/config/tarot";
import type { ChatMessageProps } from "@/themes/types";
import { ROW, TimeStamp } from "../journal";
import { HYDRE_DECK } from "./deck";
import { GoldEmblem, HydraSeal, HydreTarotDefs } from "./card";

/** Tirage inscrit au carnet de chasse : miniatures noir et or, ou pli cacheté pour qui n'y a pas droit. */
export function HydreTarotMessage({ message }: ChatMessageProps) {
    const t = useTranslations("skins.hydre.tarot");
    const tarot = message.tarot;
    if (!tarot) return null;

    const layout = TAROT_SPREADS[tarot.spread] ?? TAROT_SPREADS.unique;
    const drawerName = tarot.drawerName ?? message.username;
    const header = t("msgHeader", { player: drawerName, spread: t(`spreadsLower.${tarot.spread}`) });
    // Le gibier présagé est celui de la dernière lame tirée (la synthèse en croix).
    const omen = tarot.cards.length > 0 ? t(`cards.${tarot.cards[tarot.cards.length - 1].cardId}.gibier`) : "";

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="relative min-w-0">
                <HydreTarotDefs />
                {tarot.visible ? (
                    <div className="flex flex-wrap items-center gap-3.5">
                        <div
                            className="grid shrink-0 gap-[3px]"
                            style={{
                                gridTemplateColumns: `repeat(${layout.cols}, 32px)`,
                                gridTemplateRows: `repeat(${Math.max(...layout.slots.map((s) => s.row))}, 54px)`,
                            }}
                        >
                            {tarot.cards.map((card, i) => {
                                const slot = layout.slots[i];
                                const art = HYDRE_DECK[card.cardId]?.art;
                                return (
                                    <div
                                        key={i}
                                        className="rounded-[3px] bg-[#100D0B] p-[3px] shadow-[0_0_0_1px_#C9A25A,inset_0_0_0_2px_#100D0B,inset_0_0_0_2.6px_rgba(201,162,90,0.55),0_2px_4px_rgba(0,0,0,0.3)]"
                                        style={{ gridColumn: slot?.col, gridRow: slot?.row, transform: card.reversed ? "rotate(180deg)" : undefined }}
                                    >
                                        {art && <GoldEmblem art={{ ...art, h: "" }} weight={2.6} className="h-full w-full" />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="min-w-0 flex-1 basis-40">
                            <p className="hydre-display text-sm tracking-wide text-[color:var(--hydre-slate)]">{header}</p>
                            <ul className="mt-1">
                                {tarot.cards.map((card, i) => (
                                    <li key={i} className="text-[15px] leading-[1.32]">
                                        <span className="hydre-display tracking-[0.08em] text-[color:var(--hydre-brass-dark)]">
                                            {HYDRE_DECK[card.cardId]?.num || "—"}
                                        </span>{" "}
                                        {t(`cards.${card.cardId}.name`)}
                                        {card.reversed && <span className="italic text-[color:var(--hydre-blood)]"> · {t("reversedLower")}</span>}
                                    </li>
                                ))}
                            </ul>
                            {omen && <p className="hydre-hand mt-1 text-xl leading-[1.1] text-[color:var(--hydre-slate)]">{t("msgOmen", { gibier: omen })}</p>}
                            {tarot.secret && (
                                <p className="hydre-display mt-1 text-xs tracking-[0.12em] text-[color:var(--hydre-brass-dark)]">{t("msgOpened")}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative h-[108px] overflow-hidden bg-[#100D0B] shadow-[0_0_0_1px_#8C6A2E,0_4px_10px_rgba(46,33,22,0.35)]">
                        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                            <path d="M0 0 L50 24 L100 0" fill="none" stroke="rgba(201, 162, 90, 0.5)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <HydraSeal className="absolute left-1/2 top-[58px] -ml-[26px] -mt-[26px] h-[52px] w-[52px]" label={t("sealAria")} />
                        <span className="hydre-display absolute bottom-2.5 left-3.5 text-[13px] tracking-[0.12em] text-[#E2C47F]">{t("sealedTitle")}</span>
                        <span className="absolute bottom-2.5 right-3.5 text-sm italic text-[#A9927A]">{t("msgSealedTo", { player: drawerName })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
