"use client";

import { useTranslations } from "next-intl";
import { TAROT_SPREADS } from "@/config/tarot";
import type { ChatMessageProps } from "@/themes/types";
import { ROW, TimeStamp } from "../transcript";
import { ArchivesTarotFilters, CardArt } from "./card";

// Bruit statique d'une bande brouillée (déterministe : même tracé à chaque rendu).
function staticPath() {
    let d = "M0 20", x = 0, s = 11;
    while (x < 380) {
        x += 3 + ((s * 7) % 5);
        s = (s * 31 + 7) % 97;
        const amp = 4 + (s % 15);
        d += ` L${x} ${20 + (s % 2 ? amp : -amp)}`;
    }
    return d;
}
const STATIC = staticPath();

/** Tirage consigné à la transcription : vignettes scotchées, ou bande altérée pour qui n'y a pas droit. */
export function ArchivesTarotMessage({ message }: ChatMessageProps) {
    const t = useTranslations("skins.magnus.tarot");
    const tarot = message.tarot;
    if (!tarot) return null;

    const slots = TAROT_SPREADS[tarot.spread]?.slots ?? [];
    const drawerName = tarot.drawerName ?? message.username;
    const headline = t("msgDrew", { player: drawerName.toUpperCase(), count: tarot.count });

    return (
        <div className={ROW}>
            <TimeStamp iso={message.createdAt} />
            <div className="archives-typewriter relative min-w-0 text-[13.5px] leading-[1.5]">
                <ArchivesTarotFilters />
                {tarot.visible ? (
                    <>
                        <p>{headline}</p>
                        <div className="mt-2.5 flex flex-wrap gap-4 pl-1">
                            {tarot.cards.map((card, i) => {
                                const slot = slots[i];
                                return (
                                    <div key={i} className="flex w-[86px] flex-col items-center gap-1.5">
                                        <div
                                            className="relative h-[66px] w-[46px] bg-[#DAD6C8] p-[3px] shadow-[0_3px_6px_rgba(0,0,0,0.25)]"
                                            style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
                                        >
                                            <div className="h-full w-full bg-[#161716]" style={{ transform: card.reversed ? "rotate(180deg)" : undefined }}>
                                                <CardArt cardId={card.cardId} />
                                            </div>
                                            <span aria-hidden="true" className="absolute -top-1.5 left-2 h-[11px] w-[30px] -rotate-6 bg-[color:var(--archives-tape)]" />
                                        </div>
                                        <p className="text-center text-xs leading-[1.25]">
                                            {t(`cards.${card.cardId}.name`)}
                                            <br />
                                            <span className="archives-text text-[10.5px] text-muted-foreground">
                                                {slot ? t(`positions.${slot.key}`) : ""}
                                                {card.reversed ? ` · ${t("reversed")}` : ""}
                                            </span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        {tarot.secret && (
                            <span
                                className="archives-text absolute right-0 top-0 border-2 border-[color:var(--archives-stamp)] px-1.5 py-px text-[11px] font-bold tracking-[0.12em] text-[color:var(--archives-stamp)] opacity-85"
                                style={{ transform: "rotate(-6deg)", filter: "url(#archives-tarot-ink)" }}
                            >
                                {t("msgAuthorized")}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <p>
                            {headline} <span className="text-[#8E1C14]">{t("msgStatic")}</span>
                        </p>
                        <svg viewBox="0 0 380 40" preserveAspectRatio="none" className="mt-1 h-10 w-full" aria-hidden="true">
                            <path d={STATIC} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" filter="url(#archives-tarot-ink)" />
                        </svg>
                        <svg viewBox="0 0 380 34" preserveAspectRatio="none" className="mt-0.5 h-[34px] w-full" aria-hidden="true">
                            <g filter="url(#archives-tarot-ink)" fill="#151515">
                                <rect x="0" y="2" width="230" height="11" />
                                <rect x="0" y="20" width="320" height="11" />
                            </g>
                        </svg>
                        <span
                            className="archives-text absolute right-0 top-[30px] border-[3px] border-[#8E1C14] px-2 py-0.5 text-[13px] font-bold tracking-[0.12em] text-[#8E1C14] opacity-85"
                            style={{ transform: "rotate(-8deg)", filter: "url(#archives-tarot-ink)" }}
                        >
                            {t("msgAltered")}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
