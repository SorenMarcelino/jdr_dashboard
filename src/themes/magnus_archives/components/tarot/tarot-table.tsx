"use client";

import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { TAROT_SPREADS, TAROT_SPREAD_LIST, type TarotSpread } from "@/config/tarot";
import type { TarotTableProps } from "@/themes/types";
import { DRAWER_NPC, DRAWER_SELF, useTarotGrantForm } from "@/hooks/use-tarot-grant-form";
import { ARCHIVES_DECK } from "./deck";
import { ArchivesTarotFilters, CardBack, CardFace, Grain, PaperClip } from "./card";

// Table de tarot « déposition sur bande » : le magnétophone de l'Institut
// enregistre le tirage, chaque lame est une pièce photocopiée posée sur le
// bureau, la lecture est tapée à la machine comme une déposition.

const DECK_SIZE = Object.keys(ARCHIVES_DECK).length;
const TILTS = [-3, 1.8, -1.2, 2.4, -0.6];

// Largeur d'une lame : relative au plateau (container query), plafonnée.
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

export function ArchivesTarotTable({ state, connected, isMJ, currentUserId, players, onGrant, onDraw, onReset }: TarotTableProps) {
    const t = useTranslations("skins.magnus.tarot");
    const uid = useId();

    const status = state?.status ?? "idle";
    const active = status !== "idle";
    const drawn = active ? state?.drawn ?? 0 : 0;
    const total = active ? state?.total ?? 0 : 0;
    const visible = state?.visible ?? true;
    const drawer = state?.drawer;
    const isDrawer = active && drawer?.id === currentUserId;
    const recording = status === "open";
    const canDraw = connected && isDrawer && recording;

    // Formulaire 7-B (MJ), aligné sur le tirage en cours quand il y en a un.
    const { form, update, grant } = useTarotGrantForm({ state, players, currentUserId, defaultSpread: "trois" });
    const liveSpread = active ? state?.spread : undefined;

    // Lame lue : la dernière retournée, ou celle que l'on choisit.
    const [selected, setSelected] = useState(0);
    useEffect(() => setSelected(Math.max(0, drawn - 1)), [drawn]);
    const selIndex = Math.min(selected, Math.max(0, drawn - 1));

    const spread: TarotSpread = liveSpread ?? form.spread;
    const layout = TAROT_SPREADS[spread];
    const selSlot = layout.slots[selIndex];
    const selCard = visible && drawn > 0 ? state?.cards?.[selIndex] : undefined;
    const player = drawer?.username ?? "";
    const counter = String(drawn * 137).padStart(3, "0");
    const remaining = active ? state?.remaining ?? DECK_SIZE : DECK_SIZE;

    const statusText = !active
        ? t("statusIdle")
        : isMJ
            ? t("statusMj", { player, drawn, total })
            : recording
                ? t("statusRecording", { drawn, total })
                : t("statusStopped", { drawn, total });

    const sticky = !active
        ? t("stickyIdle")
        : isDrawer
            ? recording ? t("stickyDrawer", { name: player.split(" ")[0] }) : t("stickyDrawerDone")
            : state?.secret ? t("stickySecret") : t("stickyWatch", { player });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (grant) onGrant(grant);
    };

    return (
        <div
            className="@container relative h-full overflow-auto text-[color:var(--archives-ink)]"
            style={{
                backgroundColor: "#161C18",
                backgroundImage: "radial-gradient(ellipse 55% 65% at 48% 38%, rgba(255, 232, 178, 0.13), rgba(255, 232, 178, 0) 70%)",
            }}
        >
            <ArchivesTarotFilters />
            <div className="relative grid min-h-full gap-5 p-4 @xl:grid-cols-2 @4xl:grid-cols-[15rem_minmax(0,1fr)_20rem] @4xl:gap-6 @4xl:p-5">
                <Grain opacity={0.18} blend="overlay" />

                {/* Magnétophone, boîte de lames, formulaire ou billet */}
                <aside className="relative row-start-2 flex flex-col gap-4 @xl:col-start-1 @4xl:row-start-1">
                    <Recorder
                        recording={recording}
                        canDraw={canDraw}
                        onDraw={onDraw}
                        counter={counter}
                        statusText={statusText}
                    />

                    <div className="flex items-end gap-3.5 pl-1">
                        <DeckBox />
                        <div className="pb-1">
                            <p className="archives-pencil text-[24px] leading-[0.9] text-[#D9D3BE]" style={{ transform: "rotate(-3deg)" }}>
                                {t("remaining", { count: remaining })}
                            </p>
                            {isMJ && (
                                <button
                                    type="button"
                                    onClick={onReset}
                                    disabled={!connected || !active}
                                    className="archives-text mt-2 h-9 border border-dashed border-[#77806F] px-3 text-xs text-[#C9CCBF] disabled:opacity-40"
                                >
                                    {t("shuffle")}
                                </button>
                            )}
                        </div>
                    </div>

                    {isMJ ? (
                        <form
                            onSubmit={submit}
                            className="archives-typewriter relative bg-[#E2DDCD] px-3.5 pb-3 pt-3.5 text-[13px] shadow-[0_8px_18px_rgba(0,0,0,0.5)]"
                            style={{ transform: "rotate(-1.2deg)" }}
                        >
                            <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-5 w-[70px] -translate-x-1/2 rotate-2 bg-[color:var(--archives-tape)]" />
                            <p className="archives-text border-b border-[color:var(--archives-ink)] pb-1 text-[11px] font-bold tracking-[0.08em]">{t("formTitle")}</p>
                            <fieldset className="mt-2 flex flex-col gap-0.5">
                                <legend className="text-xs text-[#4A4B45]">{t("spreadLegend")}</legend>
                                {TAROT_SPREAD_LIST.map((key) => (
                                    <label key={key} className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`${uid}-spread`}
                                            checked={form.spread === key}
                                            onChange={() => update({ spread: key })}
                                            className="m-0 accent-[#1E1F1C]"
                                        />
                                        {t(`spreads.${key}`)}
                                    </label>
                                ))}
                            </fieldset>
                            <div className="mt-1.5 flex flex-col gap-0.5 border-t border-dashed border-[#8D8A80] pt-1.5">
                                <label className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.allowReversed}
                                        onChange={(e) => update({ allowReversed: e.target.checked })}
                                        className="m-0 accent-[#1E1F1C]"
                                    />
                                    {t("allowReversed")}
                                </label>
                                <label className="flex min-h-[26px] cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.secret}
                                        onChange={(e) => update({ secret: e.target.checked })}
                                        className="m-0 accent-[#8E1C14]"
                                    />
                                    {t("secret")}
                                </label>
                            </div>
                            <label className="mt-1.5 flex flex-col gap-0.5 text-xs text-[#4A4B45]">
                                {t("drawer")}
                                <select
                                    value={form.drawer}
                                    onChange={(e) => update({ drawer: e.target.value })}
                                    className="archives-typewriter h-[34px] border-0 border-b border-[color:var(--archives-ink)] bg-transparent text-sm text-[color:var(--archives-ink)]"
                                >
                                    {players.map((p) => (
                                        <option key={p._id} value={p._id}>{p.username}</option>
                                    ))}
                                    <option value={DRAWER_SELF}>{t("drawerSelf")}</option>
                                    <option value={DRAWER_NPC}>{t("drawerNpc")}</option>
                                </select>
                            </label>
                            {form.drawer === DRAWER_NPC && (
                                <label className="mt-1.5 flex flex-col gap-0.5 text-xs text-[#4A4B45]">
                                    {t("npcName")}
                                    <input
                                        type="text"
                                        value={form.npcName}
                                        onChange={(e) => update({ npcName: e.target.value })}
                                        maxLength={60}
                                        placeholder={t("npcPlaceholder")}
                                        className="archives-line archives-typewriter h-[30px] text-sm placeholder:text-[#77756C]"
                                    />
                                </label>
                            )}
                            <button
                                type="submit"
                                disabled={!connected || !grant}
                                className="archives-text mt-2.5 h-10 w-full border-2 border-[color:var(--archives-stamp)] text-[13px] font-bold tracking-[0.16em] text-[color:var(--archives-stamp)] disabled:opacity-40"
                                style={{ transform: "rotate(-1deg)" }}
                            >
                                {active ? t("regrant") : t("grant")}
                            </button>
                        </form>
                    ) : (
                        <p
                            className="archives-pencil self-start bg-[color:var(--archives-postit)] px-3.5 pb-[18px] pt-3.5 text-[24px] leading-[0.95] text-[#2A2A33] shadow-[0_8px_16px_rgba(0,0,0,0.45)] @4xl:w-full"
                            style={{ transform: "rotate(2.5deg)", maxWidth: 220 }}
                        >
                            {sticky}
                        </p>
                    )}
                </aside>

                {/* Lames posées sur le bureau */}
                <section
                    aria-label={t("tableLabel")}
                    className="relative row-start-1 flex min-h-[18rem] items-center justify-center py-4 @xl:col-span-2 @4xl:col-span-1 @4xl:col-start-2"
                    style={{ containerType: "inline-size" }}
                >
                    {!active && !isMJ ? (
                        <p className="archives-pencil max-w-[16rem] text-center text-[26px] leading-[0.95] text-[#D9D3BE]" style={{ transform: "rotate(-2deg)" }}>
                            {t("tableEmpty")}
                        </p>
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
                                    <div key={slot.key} className="flex flex-col items-center gap-1.5" style={{ gridColumn: slot.col, gridRow: slot.row }}>
                                        <div
                                            className="relative transition-transform duration-150 ease-out"
                                            style={{ transform: `rotate(${TILTS[i]}deg) translateY(${picked ? -10 : 0}px)` }}
                                        >
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
                                                    className="block p-0"
                                                    style={{
                                                        ...CARD_BOX,
                                                        boxShadow: picked
                                                            ? "0 22px 34px rgba(0, 0, 0, 0.7), 0 0 0 2px var(--archives-signal)"
                                                            : "0 8px 16px rgba(0, 0, 0, 0.55)",
                                                    }}
                                                >
                                                    {card ? <CardFace cardId={card.cardId} reversed={card.reversed} /> : <CardBack confidential />}
                                                </button>
                                            ) : (
                                                <div
                                                    className="archives-pencil flex items-center justify-center border-2 border-dashed border-[rgba(217,211,190,0.28)] text-[rgba(217,211,190,0.6)]"
                                                    style={CARD_BOX}
                                                >
                                                    <span className="text-[1.7em]">{t("slotEmpty")}</span>
                                                </div>
                                            )}
                                            {card && (
                                                <PaperClip
                                                    className="absolute -top-3 left-[22%]"
                                                    style={{ width: "calc(var(--cw) * 0.13)", transform: "rotate(-8deg)" }}
                                                />
                                            )}
                                            {card?.reversed && (
                                                <span
                                                    aria-hidden="true"
                                                    className="archives-pencil absolute -right-3.5 top-[16%] bg-[color:var(--archives-postit)] px-[0.4em] pb-[0.5em] pt-[0.3em] leading-[0.9] text-[#2A2A33] shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                                                    style={{ fontSize: "calc(var(--cw) / 7.5)", transform: "rotate(7deg)" }}
                                                >
                                                    {t("reversedNote")}
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className="archives-tape archives-marker px-3 pb-px pt-0.5 text-[#1E1F1C]"
                                            style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)`, fontSize: spread === "croix" ? 12 : 16 }}
                                        >
                                            {position}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Transcription de la déposition */}
                <aside className="relative row-start-3 @xl:col-start-2 @xl:row-start-2 @4xl:col-start-3 @4xl:row-start-1">
                    <div
                        className="archives-typewriter relative flex h-full min-h-[22rem] flex-col gap-2.5 overflow-hidden bg-[#E8E4D8] px-5 pb-4 pt-5 text-[13.5px] leading-[1.5] shadow-[0_14px_30px_rgba(0,0,0,0.55)]"
                        style={{ transform: "rotate(0.7deg)" }}
                    >
                        {!active ? (
                            <>
                                <p className="archives-text text-xs font-bold tracking-[0.06em]">{t("sheetEmptyTitle")}</p>
                                <p>{isMJ ? t("sheetEmptyMj") : t("sheetEmptyPlayer")}</p>
                            </>
                        ) : !visible ? (
                            <Redacted player={player} />
                        ) : !selCard || !selSlot ? (
                            <>
                                <p className="archives-text text-xs font-bold tracking-[0.06em]">{t("statementPending")}</p>
                                <p className="text-xs text-[#8E1C14]">{t("click")}</p>
                                <p>{t("sheetWaiting", { player })}</p>
                            </>
                        ) : (
                            <Statement
                                cardId={selCard.cardId}
                                reversed={selCard.reversed}
                                slotKey={selSlot.key}
                                player={player}
                                allowReversed={!!state?.allowReversed}
                                secret={!!state?.secret}
                            />
                        )}
                        <Grain opacity={0.2} blend="multiply" />
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Recorder({ recording, canDraw, onDraw, counter, statusText }: {
    recording: boolean;
    canDraw: boolean;
    onDraw: () => void;
    counter: string;
    statusText: string;
}) {
    const t = useTranslations("skins.magnus.tarot");
    const key = "flex h-11 w-[38px] items-center justify-center rounded-[3px] bg-[#C9C5B6] shadow-[0_3px_0_#77756C]";
    return (
        <div className="relative rounded-[10px] bg-[#2B2E2A] px-3.5 pb-3.5 pt-3 text-[#A7AA9F] shadow-[0_12px_26px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.09)]">
            <div className="archives-text flex items-center justify-between text-[10px] tracking-[0.08em]">
                <span>{t("recorderLabel")}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" className="archives-rec-light" data-running={recording} aria-hidden="true">
                    <circle cx="5" cy="5" r="4" fill={recording ? "#E0473A" : "#5A2A24"} />
                </svg>
            </div>
            <div className="mt-2 flex h-[74px] items-center justify-around rounded-md border-2 border-[#191B19] bg-[#0B0D0C] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <Reel wound={27} running={recording} />
                <div className="h-3.5 w-10 border-y-2 border-[#3E2E22]" />
                <Reel wound={17} running={recording} />
            </div>
            <div className="mt-3 flex items-center gap-1.5">
                <div aria-hidden="true" className={key}><svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 0 L0 6 L8 12 Z M16 0 L8 6 L16 12 Z" fill="#2B2E2A" /></svg></div>
                <div aria-hidden="true" className={key}><svg width="10" height="12" viewBox="0 0 10 12"><path d="M0 0 L10 6 L0 12 Z" fill="#2B2E2A" /></svg></div>
                <div aria-hidden="true" className={key}><svg width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2B2E2A" /></svg></div>
                <button
                    type="button"
                    onClick={onDraw}
                    disabled={!canDraw}
                    aria-label={t("recordAria")}
                    title={t("recordAria")}
                    className="archives-key flex h-11 w-11 items-center justify-center rounded-[3px] bg-[#9E2A20] shadow-[0_3px_0_#5A140E] disabled:opacity-55"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="#F2E3DA" /></svg>
                </button>
                <div role="img" aria-label={t("counterAria", { value: counter })} className="ml-auto flex gap-0.5">
                    {counter.split("").map((digit, i) => (
                        <span key={i} className="archives-text flex h-[22px] w-3.5 items-center justify-center rounded-sm bg-[#0B0D0C] text-sm text-[#E6E2D2]">{digit}</span>
                    ))}
                </div>
            </div>
            <p aria-live="polite" className="archives-text mt-2 text-[11px] text-[#C9CCBF]">{statusText}</p>
        </div>
    );
}

function Reel({ wound, running }: { wound: number; running: boolean }) {
    return (
        <svg viewBox="-30 -30 60 60" width="62" height="62" className="archives-reel" data-running={running} aria-hidden="true">
            <circle r={wound} fill="#3E2E22" />
            <circle r="12" fill="#C9C5B6" />
            <path d="M0 -12 L0 -4 M10.4 6 L3.5 2 M-10.4 6 L-3.5 2" stroke="#2B2E2A" strokeWidth="3" strokeLinecap="round" />
            <circle r="3" fill="#2B2E2A" />
        </svg>
    );
}

function DeckBox() {
    const t = useTranslations("skins.magnus.tarot");
    return (
        <div aria-hidden="true" className="relative h-[104px] w-[70px]">
            <div className="absolute left-1.5 top-1.5 h-[98px] w-16 rotate-[4deg] bg-[#B9B4A4]" />
            <div className="absolute left-[3px] top-[3px] h-[98px] w-16 -rotate-2 bg-[#C8C3B3]" />
            <div className="absolute left-0 top-0 h-[98px] w-16 rotate-1 border border-[#A49E8C] bg-[#D6D0BE] p-[5px]">
                <div className="archives-text text-[6.5px] font-bold tracking-[0.06em]">{t("backSlip")}</div>
                <div className="mt-[3px] h-[62px]" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 7px, rgba(78, 63, 126, 0.45) 7px 8px)" }} />
            </div>
        </div>
    );
}

function Statement({ cardId, reversed, slotKey, player, allowReversed, secret }: {
    cardId: string;
    reversed: boolean;
    slotKey: string;
    player: string;
    allowReversed: boolean;
    secret: boolean;
}) {
    const t = useTranslations("skins.magnus.tarot");
    const card = ARCHIVES_DECK[cardId];
    const name = t(`cards.${cardId}.name`);
    const of = t(`positionsOf.${slotKey}`);
    const stampColor = secret ? "#8E1C14" : "var(--archives-stamp)";

    return (
        <>
            <div className="archives-text flex justify-between text-xs font-bold tracking-[0.06em]">
                <span>{t("statementNo", { code: card?.code ?? "" })}</span>
                <span>{t("page")}</span>
            </div>
            <p className="text-[12.5px] leading-[1.45] text-[#4A4B45]">
                {t(reversed ? "cardLineReversed" : "cardLine", { name })}
                <br />
                {t("regarding", { of })}
                <br />
                {t("deponent", { player })}
            </p>
            <p className="text-xs text-[#8E1C14]">{t("click")}</p>
            <p>{t("intro", { player, of })}</p>
            <p>{t(`cards.${cardId}.${reversed ? "rev" : "up"}`)}</p>
            <p>{t("outro")}</p>
            <p className="text-xs text-[#8E1C14]">{t("click")}</p>
            <p className="archives-pencil text-[24px] leading-[0.95] text-[#3F4652]" style={{ transform: "rotate(-2.5deg)" }}>
                {t(`cards.${cardId}.${reversed ? "kwRev" : "kwUp"}`)}
            </p>
            {allowReversed && (
                <p className="relative mt-auto bg-[#F1EDE2] px-3 py-2.5 text-xs leading-[1.4] text-[#34352F] shadow-[0_3px_8px_rgba(0,0,0,0.18)]" style={{ transform: "rotate(-1.5deg)" }}>
                    <svg viewBox="0 0 30 8" className="absolute -top-[3px] left-[18px] h-2 w-[30px]" aria-hidden="true">
                        <path d="M2 6 L2 2 L28 2 L28 6" fill="none" stroke="#8A8B85" strokeWidth="1.6" />
                    </svg>
                    <span className="archives-text font-bold">{t("attached", { orientation: t(reversed ? "upright" : "reversed") })}</span>{" "}
                    {t(`cards.${cardId}.${reversed ? "up" : "rev"}`)}
                </p>
            )}
            <span
                className="archives-text pointer-events-none absolute right-[18px] border-[3px] px-2.5 py-[3px] text-[15px] font-bold tracking-[0.14em] opacity-80"
                style={{
                    bottom: allowReversed ? 150 : 24,
                    borderColor: stampColor,
                    color: stampColor,
                    transform: "rotate(-9deg)",
                    filter: "url(#archives-tarot-ink)",
                }}
            >
                {secret ? t("confidential") : t("stampArchived")}
            </span>
        </>
    );
}

function Redacted({ player }: { player: string }) {
    const t = useTranslations("skins.magnus.tarot");
    return (
        <>
            <p className="archives-text text-xs font-bold tracking-[0.06em]">{t("statementNo", { code: "███████" })}</p>
            <svg viewBox="0 0 276 200" className="mt-1.5 w-full" aria-hidden="true">
                <g filter="url(#archives-tarot-ink)" fill="#151515">
                    <rect x="0" y="0" width="190" height="14" />
                    <rect x="0" y="26" width="120" height="12" />
                    <rect x="0" y="62" width="276" height="12" />
                    <rect x="0" y="84" width="250" height="12" />
                    <rect x="0" y="106" width="268" height="12" />
                    <rect x="0" y="128" width="210" height="12" />
                    <rect x="0" y="164" width="150" height="12" />
                </g>
            </svg>
            <p className="archives-pencil text-[30px] leading-[0.9] text-[#8E1C14]" style={{ transform: "rotate(-4deg)" }}>{t("redactedNote")}</p>
            <p className="mt-auto text-xs leading-[1.45] text-[#4A4B45]">{t("redactedDest", { player })}</p>
            <span
                className="archives-text pointer-events-none absolute right-[18px] top-[90px] border-[3px] border-[#8E1C14] px-2.5 py-[3px] text-[17px] font-bold tracking-[0.14em] text-[#8E1C14] opacity-85"
                style={{ transform: "rotate(-11deg)", filter: "url(#archives-tarot-ink)" }}
            >
                {t("confidential")}
            </span>
        </>
    );
}
