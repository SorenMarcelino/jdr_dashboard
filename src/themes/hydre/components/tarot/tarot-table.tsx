"use client";

import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { TAROT_SPREADS, TAROT_SPREAD_LIST, type TarotSpread } from "@/config/tarot";
import type { TarotTableProps } from "@/themes/types";
import { DRAWER_NPC, DRAWER_SELF, useTarotGrantForm } from "@/hooks/use-tarot-grant-form";
import { HYDRE_DECK, BACK_ART } from "./deck";
import { CardBack, CardFace, GoldEmblem, HydraSeal, HydreTarotDefs, Stock } from "./card";

// Table de tarot du club de l'Hydre : sous-main de cuir noir à filets dorés,
// lames noires à dorure à chaud, page de lecture noir et or. Steampunk pour
// les chasseurs, dark fantasy pour le gibier que chaque lame présage.

const DECK_SIZE = Object.keys(HYDRE_DECK).length;

const CARD_WIDTH: Record<TarotSpread, string> = {
    unique: "min(200px, 58cqw)",
    trois: "min(164px, calc((100cqw - 72px) / 3.15))",
    croix: "min(94px, calc((100cqw - 64px) / 3.3))",
};
const COL_GAP: Record<TarotSpread, string> = {
    unique: "0px",
    trois: "clamp(12px, 4cqw, 30px)",
    croix: "clamp(10px, 4cqw, 26px)",
};
const CARD_BOX: CSSProperties = {
    width: "var(--cw)",
    height: "calc(var(--cw) * 1.707)",
    fontSize: "calc(var(--cw) / 14.4)",
};
// Panneau noir à filet doré (ordonnance, billet, page de lecture).
const PANEL_SHADOW = "0 0 0 1px #8C6A2E, inset 0 0 0 5px #100D0B, inset 0 0 0 6px rgba(201, 162, 90, 0.35), 0 10px 22px rgba(0, 0, 0, 0.5)";
const BRASS_BUTTON =
    "hydre-display rounded-[3px] border border-[#7A5C28] bg-[linear-gradient(to_bottom,#E6C987,#C9A25A_45%,#7A5C28)] text-[#1C140E] shadow-[inset_0_1px_0_rgba(255,245,210,0.55),0_1px_0_rgba(0,0,0,0.35)] disabled:opacity-45";

export function HydreTarotTable({ state, connected, isMJ, currentUserId, players, onGrant, onDraw, onReset }: TarotTableProps) {
    const t = useTranslations("skins.hydre.tarot");
    const uid = useId();

    const status = state?.status ?? "idle";
    const active = status !== "idle";
    const drawn = active ? state?.drawn ?? 0 : 0;
    const total = active ? state?.total ?? 0 : 0;
    const visible = state?.visible ?? true;
    const drawer = state?.drawer;
    const isDrawer = active && drawer?.id === currentUserId;
    const open = status === "open";
    const canDraw = connected && isDrawer && open;

    // Ordonnance du MJ, alignée sur la séance en cours quand il y en a une.
    const { form, update, grant } = useTarotGrantForm({ state, players, currentUserId, defaultSpread: "croix" });
    const liveSpread = active ? state?.spread : undefined;

    // Lame lue : la dernière tirée, ou celle que l'on choisit.
    const [selected, setSelected] = useState(0);
    useEffect(() => setSelected(Math.max(0, drawn - 1)), [drawn]);
    const selIndex = Math.min(selected, Math.max(0, drawn - 1));

    const spread: TarotSpread = liveSpread ?? form.spread;
    const layout = TAROT_SPREADS[spread];
    const selSlot = layout.slots[selIndex];
    const selCard = visible && drawn > 0 ? state?.cards?.[selIndex] : undefined;
    const player = drawer?.username ?? "";
    const remaining = active ? state?.remaining ?? DECK_SIZE : DECK_SIZE;

    const note = !active
        ? t("noteIdle")
        : isDrawer
            ? open ? t("noteDrawer", { name: player.split(" ")[0] }) : t("noteDrawerDone")
            : state?.secret ? t("noteSecret") : t("noteWatch", { player });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (grant) onGrant(grant);
    };

    return (
        <div className="@container relative h-full overflow-auto bg-[#17120E] text-[#E8DCC0]">
            <HydreTarotDefs />
            <div className="relative grid min-h-full gap-5 p-5 @xl:grid-cols-2 @4xl:grid-cols-[15rem_minmax(0,1fr)_20rem] @4xl:gap-6 @4xl:p-6">
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
                    <rect width="100%" height="100%" filter="url(#hydre-tarot-leather)" />
                </svg>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(ellipse 50% 60% at 50% 42%, rgba(255, 210, 140, 0.07), rgba(255, 210, 140, 0) 70%)" }}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-[7px] border border-[rgba(201,162,90,0.55)]" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-[11px] border border-[rgba(201,162,90,0.25)]" />

                {/* Le paquet, l'ordonnance ou le billet du MJ */}
                <aside className="relative row-start-2 flex flex-col gap-4 @xl:col-start-1 @4xl:row-start-1">
                    <div className="flex items-end gap-4">
                        <DeckStack />
                        <div className="flex flex-col gap-2 pb-1.5">
                            <span className="hydre-display text-[13px] tracking-[0.14em] text-[#C9A25A]">{t("deckLabel")}</span>
                            <span className="text-base italic leading-tight">{t("remaining", { count: remaining })}</span>
                            {isMJ && (
                                <button
                                    type="button"
                                    onClick={onReset}
                                    disabled={!connected || !active}
                                    className="hydre-display h-9 border border-[#8C6A2E] px-3.5 text-sm tracking-[0.08em] text-[#E6C987] disabled:opacity-40"
                                >
                                    {t("shuffle")}
                                </button>
                            )}
                        </div>
                    </div>

                    {isMJ && canDraw && (
                        <button type="button" onClick={onDraw} className={`${BRASS_BUTTON} h-12 text-[17px]`}>
                            {t("draw", { next: drawn + 1, total })}
                        </button>
                    )}
                    {isMJ ? (
                        <form onSubmit={submit} className="relative bg-[#100D0B] px-4 py-3.5 text-[15px]" style={{ boxShadow: PANEL_SHADOW }}>
                            <p className="hydre-display text-center text-[15px] tracking-[0.2em] text-[#E2C47F]">{t("formTitle")}</p>
                            <p className="text-center text-[13px] italic text-[#A9927A]">{t("formSub")}</p>
                            <div className="mb-1.5 mt-2.5 h-px bg-[linear-gradient(to_right,transparent,#C9A25A,transparent)]" />
                            <fieldset className="flex flex-col">
                                <legend className="hydre-display text-[13px] tracking-[0.1em] text-[#C9A25A]">{t("spreadLegend")}</legend>
                                {TAROT_SPREAD_LIST.map((key) => (
                                    <label key={key} className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`${uid}-spread`}
                                            checked={form.spread === key}
                                            onChange={() => update({ spread: key })}
                                            className="m-0 accent-[#C9A25A]"
                                        />
                                        {t(`spreads.${key}`)}
                                    </label>
                                ))}
                            </fieldset>
                            <div className="my-1.5 h-px bg-[linear-gradient(to_right,transparent,rgba(201,162,90,0.5),transparent)]" />
                            <label className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.allowReversed}
                                    onChange={(e) => update({ allowReversed: e.target.checked })}
                                    className="m-0 accent-[#C9A25A]"
                                />
                                {t("allowReversed")}
                            </label>
                            <label className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.secret}
                                    onChange={(e) => update({ secret: e.target.checked })}
                                    className="m-0 accent-[#C9A25A]"
                                />
                                {t("secret")}
                            </label>
                            <label className="hydre-display mt-1.5 flex flex-col gap-0.5 text-[13px] tracking-[0.1em] text-[#C9A25A]">
                                {t("drawer")}
                                <select
                                    value={form.drawer}
                                    onChange={(e) => update({ drawer: e.target.value })}
                                    className="hydre-text h-8 border-0 border-b border-[#8C6A2E] bg-transparent text-[17px] tracking-normal text-[#E8DCC0] [&>option]:bg-[#15110D]"
                                >
                                    {players.map((p) => (
                                        <option key={p._id} value={p._id}>{p.username}</option>
                                    ))}
                                    <option value={DRAWER_SELF}>{t("drawerSelf")}</option>
                                    <option value={DRAWER_NPC}>{t("drawerNpc")}</option>
                                </select>
                            </label>
                            {form.drawer === DRAWER_NPC && (
                                <label className="hydre-display mt-1.5 flex flex-col gap-0.5 text-[13px] tracking-[0.1em] text-[#C9A25A]">
                                    {t("npcName")}
                                    <input
                                        type="text"
                                        value={form.npcName}
                                        onChange={(e) => update({ npcName: e.target.value })}
                                        maxLength={60}
                                        placeholder={t("npcPlaceholder")}
                                        className="hydre-hand h-8 border-0 border-b border-[#8C6A2E] bg-transparent text-[21px] tracking-normal text-[#E8DCC0] outline-none placeholder:text-[#7D6B55] focus-visible:border-[#E6C987]"
                                    />
                                </label>
                            )}
                            <button type="submit" disabled={!connected || !grant} className={`${BRASS_BUTTON} mt-3 h-10 w-full text-base`}>
                                {active ? t("regrant") : t("grant")}
                            </button>
                        </form>
                    ) : (
                        <>
                            <div className="relative bg-[#100D0B] px-4 py-3.5" style={{ boxShadow: PANEL_SHADOW }}>
                                <p className="hydre-display text-[13px] tracking-[0.14em] text-[#C9A25A]">{t("noteTitle")}</p>
                                <p className="hydre-hand mt-1.5 text-[23px] leading-[1.12]">{note}</p>
                            </div>
                            {canDraw && (
                                <button type="button" onClick={onDraw} className={`${BRASS_BUTTON} h-12 text-[17px]`}>
                                    {t("draw", { next: drawn + 1, total })}
                                </button>
                            )}
                        </>
                    )}
                </aside>

                {/* Les lames sur le sous-main */}
                <section
                    aria-label={t("tableLabel")}
                    className="relative row-start-1 flex min-h-[18rem] items-center justify-center py-4 @xl:col-span-2 @4xl:col-span-1 @4xl:col-start-2"
                    style={{ containerType: "inline-size" }}
                >
                    {!active && !isMJ ? (
                        <p className="max-w-[16rem] text-center text-lg italic text-[#A9927A]">{t("tableEmpty")}</p>
                    ) : (
                        <div
                            className="grid items-start justify-items-center"
                            style={{
                                gridTemplateColumns: `repeat(${layout.cols}, auto)`,
                                columnGap: COL_GAP[spread],
                                rowGap: 8,
                                ["--cw" as string]: CARD_WIDTH[spread],
                            } as CSSProperties}
                        >
                            {layout.slots.map((slot, i) => {
                                const isDrawn = i < drawn;
                                const card = visible ? state?.cards?.[i] : undefined;
                                const picked = isDrawn && i === selIndex;
                                const position = t(`positions.${slot.key}`);
                                return (
                                    <div key={slot.key} className="flex flex-col items-center gap-[7px]" style={{ gridColumn: slot.col, gridRow: slot.row }}>
                                        <div className="transition-transform duration-200 ease-out" style={{ transform: `translateY(${picked ? -10 : 0}px)` }}>
                                            {isDrawn ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(i)}
                                                    aria-pressed={picked}
                                                    aria-label={
                                                        !card
                                                            ? t("cardAriaHidden", { position })
                                                            : t(card.reversed ? "cardAriaReversed" : "cardAria", { position, name: t(`cards.${card.cardId}.name`) })
                                                    }
                                                    className="block rounded-[0.6em] p-0"
                                                    style={{
                                                        ...CARD_BOX,
                                                        boxShadow: picked
                                                            ? "0 0 0 1px #F3DFA6, 0 0 24px rgba(226, 196, 127, 0.28), 0 22px 34px rgba(0, 0, 0, 0.7)"
                                                            : "0 10px 18px rgba(0, 0, 0, 0.6)",
                                                    }}
                                                >
                                                    {card ? <CardFace cardId={card.cardId} reversed={card.reversed} /> : <CardBack label={t("sealed")} />}
                                                </button>
                                            ) : (
                                                <div
                                                    className="rounded-[0.6em] border border-[rgba(201,162,90,0.35)]"
                                                    style={{ ...CARD_BOX, boxShadow: "inset 0 0 0 4px #17120E, inset 0 0 0 5px rgba(201, 162, 90, 0.18)" }}
                                                />
                                            )}
                                        </div>
                                        <div
                                            className="hydre-display flex items-center gap-2 tracking-[0.16em]"
                                            style={{ fontSize: spread === "croix" ? 12 : 14, color: picked ? "#F3DFA6" : "#A9927A" }}
                                        >
                                            <span aria-hidden="true" className="h-px w-3.5 bg-[#8C6A2E]" />
                                            {position}
                                            <span aria-hidden="true" className="h-px w-3.5 bg-[#8C6A2E]" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Page de lecture */}
                <aside className="relative row-start-3 @xl:col-start-2 @xl:row-start-2 @4xl:col-start-3 @4xl:row-start-1">
                    <div className="relative flex h-full min-h-[22rem] flex-col gap-2.5 overflow-hidden bg-[#100D0B] px-6 pb-[18px] pt-[22px]" style={{ boxShadow: PANEL_SHADOW }}>
                        <Stock />
                        {!active ? (
                            <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
                                <GoldEmblem art={BACK_ART} weight={1.2} className="w-20 opacity-80" />
                                <p className="hydre-display text-sm tracking-[0.22em] text-[#C9A25A]">{t("emptyTitle")}</p>
                                <p className="text-base italic text-[#A9927A]">{isMJ ? t("emptyMj") : t("emptyPlayer")}</p>
                            </div>
                        ) : !visible ? (
                            <SealedLetter player={player} />
                        ) : !selCard || !selSlot ? (
                            <div className="relative flex flex-1 flex-col items-center justify-center gap-2 text-center">
                                <p className="hydre-display text-sm tracking-[0.22em] text-[#C9A25A]">{t("pendingTitle")}</p>
                                <p className="text-base italic text-[#A9927A]">{t("waiting", { player })}</p>
                            </div>
                        ) : (
                            <Reading
                                cardId={selCard.cardId}
                                reversed={selCard.reversed}
                                position={t(`positions.${selSlot.key}`)}
                                allowReversed={!!state?.allowReversed}
                                secret={!!state?.secret}
                            />
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function DeckStack() {
    const back = "absolute h-[148px] w-[86px] rounded-[7px] bg-[#0F0C0A]";
    return (
        <div aria-hidden="true" className="relative h-[160px] w-24 shrink-0" style={{ fontSize: 6 }}>
            <div className={`${back} left-[9px] top-[9px] shadow-[0_0_0_1px_#8C6A2E]`} />
            <div className={`${back} left-1.5 top-1.5 shadow-[0_0_0_1px_#B08A43]`} />
            <div className={`${back} left-[3px] top-[3px] shadow-[0_0_0_1px_#8C6A2E]`} />
            <div className="absolute left-0 top-0 h-[148px] w-[86px] shadow-[0_10px_18px_rgba(0,0,0,0.6)]">
                <CardBack />
            </div>
        </div>
    );
}

function Reading({ cardId, reversed, position, allowReversed, secret }: {
    cardId: string;
    reversed: boolean;
    position: string;
    allowReversed: boolean;
    secret: boolean;
}) {
    const t = useTranslations("skins.hydre.tarot");
    const card = HYDRE_DECK[cardId];
    const mark = (on: boolean) => (
        <span aria-hidden="true" className="h-[13px] w-[13px] border border-[#C9A25A]" style={{ background: on ? "#C9A25A" : "transparent" }} />
    );

    return (
        <>
            {secret && <HydraSeal className="absolute right-3.5 top-3.5 h-[46px] w-[46px]" label={t("sealAria")} />}
            <p className="hydre-display relative text-center text-[13px] tracking-[0.22em] text-[#C9A25A]">
                {t("readingTitle", { num: card?.num || "—", position: position.toUpperCase() })}
            </p>
            <div className="relative text-center">
                <h3 className="hydre-display text-[32px] leading-[1.05] text-[#E2C47F]">{t(`cards.${cardId}.name`)}</h3>
                <p className="mt-1 text-[17px] italic text-[#A9927A]">{t(`cards.${cardId}.sub`)}</p>
            </div>
            <div aria-hidden="true" className="relative flex items-center gap-2.5 text-[#8C6A2E]">
                <span className="h-px flex-1 bg-[linear-gradient(to_right,transparent,#C9A25A)]" />
                <span className="text-[10px]">◆</span>
                <span className="h-px flex-1 bg-[linear-gradient(to_left,transparent,#C9A25A)]" />
            </div>
            <p className="hydre-display relative flex justify-center gap-6 text-sm tracking-[0.08em]">
                <span className="flex items-center gap-[7px]" style={{ color: reversed ? "#7D6B55" : "#E2C47F" }}>{mark(!reversed)}{t("upright")}</span>
                <span className="flex items-center gap-[7px]" style={{ color: reversed ? "#E2C47F" : "#7D6B55" }}>{mark(reversed)}{t("reversed")}</span>
            </p>
            <p className="relative mt-0.5 text-[17px] leading-[1.45]">{t(`cards.${cardId}.${reversed ? "rev" : "up"}`)}</p>
            <div className="relative border-l border-[#8C6A2E] pl-3">
                <p className="hydre-display text-xs tracking-[0.16em] text-[#C9A25A]">{t("gibierLabel")}</p>
                <p className="text-[17px] italic">{t(`cards.${cardId}.gibier`)}</p>
            </div>
            <p className="hydre-hand relative text-[22px] leading-[1.1] text-[#C9A25A]" style={{ transform: "rotate(-1.5deg)" }}>
                {t(`cards.${cardId}.${reversed ? "hRev" : "hUp"}`)}
            </p>
            {allowReversed && (
                <div className="relative mt-auto border-t border-[rgba(201,162,90,0.35)] pt-[9px]">
                    <p className="hydre-display text-xs tracking-[0.16em] text-[#C9A25A]">
                        {t("otherLabel", { orientation: t(reversed ? "uprightLower" : "reversedLower") })}
                    </p>
                    <p className="mt-[3px] text-[15px] italic leading-[1.4] text-[#A9927A]">{t(`cards.${cardId}.${reversed ? "up" : "rev"}`)}</p>
                </div>
            )}
        </>
    );
}

function SealedLetter({ player }: { player: string }) {
    const t = useTranslations("skins.hydre.tarot");
    return (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
            <div className="relative h-40 w-full max-w-[250px] bg-[#0B0907] shadow-[0_0_0_1px_#8C6A2E,0_8px_18px_rgba(0,0,0,0.6)]">
                <svg viewBox="0 0 250 160" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <path d="M0 0 L125 88 L250 0 M0 160 L100 70 M250 160 L150 70" fill="none" stroke="rgba(201, 162, 90, 0.45)" strokeWidth="1" />
                </svg>
                <HydraSeal className="absolute left-1/2 top-[88px] -ml-[35px] -mt-[35px] h-[70px] w-[70px]" label={t("sealAria")} />
            </div>
            <p className="hydre-display text-2xl tracking-[0.16em] text-[#E2C47F]">{t("sealedTitle")}</p>
            <p className="text-base leading-[1.45] text-[#A9927A]">{t("sealedDest", { player })}</p>
        </div>
    );
}
