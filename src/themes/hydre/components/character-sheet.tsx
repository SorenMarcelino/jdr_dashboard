"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CharacterSheetProps } from "@/themes/types";
import { BrassRing, DecorGear, GearMedallion, Plaque } from "./ornaments";

// Fiche Hydre mise en page comme la fiche papier du livre de base :
// médaillons-engrenages des caractéristiques, anneaux de laiton (PV,
// blessures, protection, initiative), phrase de synthèse, puis compétences,
// compétences spéciales, armes, possessions et notes. Elle lit les champs du
// template « hydre » par leur id (cf. back/seeds/hydreSeed.mjs) ; toutes les
// valeurs sont saisies à la main, rien n'est calculé.

const CHARACTERISTICS = ["charisma", "dexterity", "endurance", "strength", "intelligence"] as const;

// Écriture manuscrite à l'encre ardoise, comme les valeurs de la fiche d'exemple.
const HAND = "hydre-hand text-[color:var(--hydre-slate)]";

/** Bloc de la fiche : bandeau-plaque posé sur un panneau de parchemin plus sombre. */
function Panel({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cn("flex min-w-0 flex-col", className)}>
            <Plaque className="relative z-[1] ml-2 self-start">{title}</Plaque>
            <div className="-mt-3 rounded-sm border border-[color:var(--hydre-brass-dark)]/35 bg-[color:var(--hydre-parchment-dark)]/70 px-3 pb-3 pt-5 shadow-[inset_0_0_12px_rgba(122,92,40,0.12)]">
                {children}
            </div>
        </section>
    );
}

/** Petite plaque sombre sous un médaillon (« Charisme », « Force »…). */
function Tag({ children }: { children: ReactNode }) {
    return (
        <span className="hydre-text rounded-sm border border-[color:var(--hydre-brass)] bg-[color:var(--hydre-plaque)] px-2 py-px text-[12px] font-semibold leading-tight text-[color:var(--hydre-plaque-text)]">
            {children}
        </span>
    );
}

export function HydreCharacterSheet({ template, instance, isEditable, onSave }: CharacterSheetProps) {
    const t = useTranslations("skins.hydre.sheet");
    const tc = useTranslations("characterSheet");
    const readOnly = !isEditable;

    const defaults = Object.fromEntries(template.fields.map((f) => [f.id, f.defaultValue ?? null]));
    const [values, setValues] = useState<Record<string, unknown>>(
        instance?.values ? { ...defaults, ...instance.values } : defaults
    );
    const [saving, setSaving] = useState(false);

    const str = (id: string) => (values[id] as string | null) ?? "";
    const num = (id: string) => Number(values[id] ?? 0) || 0;
    const set = (id: string, value: unknown) => setValues((prev) => ({ ...prev, [id]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(values);
        } finally {
            setSaving(false);
        }
    };

    // Compétences et lignes d'armes : pilotées par le template (ordre et libellés).
    const skills = template.fields.filter((f) => f.section === "skills");
    const weaponRows = (template.groups ?? []).filter((g) => g.section === "weapons");
    const skillLabel = (id: string, fallback: string) => (t.has(`skillNames.${id}`) ? t(`skillNames.${id}`) : fallback);

    const numberInput = (id: string, label: string, className: string, max?: number) => (
        <input
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            value={num(id)}
            onChange={(e) => set(id, Number(e.target.value))}
            disabled={readOnly}
            aria-label={label}
            className={cn("bg-transparent text-center outline-none", className)}
        />
    );

    const ruled = (id: string, label: string, rows: number, className?: string) => (
        <textarea
            value={str(id)}
            onChange={(e) => set(id, e.target.value)}
            disabled={readOnly}
            rows={rows}
            aria-label={label}
            className={cn("hydre-ruled w-full text-xl", HAND, className)}
        />
    );

    const line = (id: string, label: string, className?: string) => (
        <label className={cn("flex min-w-0 items-baseline gap-2", className)}>
            <span className="hydre-display shrink-0 text-[15px] uppercase">{label} :</span>
            <input
                value={str(id)}
                onChange={(e) => set(id, e.target.value)}
                disabled={readOnly}
                className={cn("hydre-line min-w-0 flex-1 px-1 text-2xl leading-tight", HAND)}
            />
        </label>
    );

    const wounds = num("wounds");

    return (
        <div className="@container hydre-paper hydre-text relative min-h-full w-full">
            {/* Barre de la fiche, collée en haut pendant le défilement */}
            <div className="hydre-paper sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[color:var(--hydre-brass-dark)]/40 px-4 py-2 @[640px]:px-6">
                <span className="hydre-display min-w-0 truncate text-sm uppercase tracking-wide text-[color:var(--hydre-slate)]">{t("fileTitle")}</span>
                {isEditable && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="hydre-brass hydre-display h-9 shrink-0 rounded-sm px-4 text-sm uppercase disabled:opacity-60"
                    >
                        {saving ? tc("saving") : tc("save")}
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-6 p-4 @[640px]:p-6">
                {/* Caractéristiques + compteurs */}
                <div className="grid grid-cols-1 items-center gap-6 @[760px]:grid-cols-[minmax(0,1fr)_auto]">
                    <div role="group" aria-label={t("characteristics")} className="relative">
                        {/* Tige de laiton qui relie les engrenages */}
                        <div aria-hidden="true" className="hydre-rule absolute inset-x-4 top-[38%] hidden @[480px]:block" />
                        <div className="relative grid grid-cols-3 justify-items-center gap-x-2 gap-y-4 @[480px]:grid-cols-5">
                            {CHARACTERISTICS.map((id) => (
                                <div key={id} className="flex w-full max-w-[104px] flex-col items-center gap-1">
                                    <GearMedallion className="w-full">
                                        <span className="flex items-start">
                                            {numberInput(id, t(`characteristic.${id}`), cn("w-[2.2ch] text-[length:clamp(1.5rem,4.5cqw,2.25rem)] leading-none", HAND), 100)}
                                            <span className="hydre-display pt-0.5 text-xs text-[color:var(--hydre-slate)]">%</span>
                                        </span>
                                    </GearMedallion>
                                    <Tag>{t(`characteristic.${id}`)}</Tag>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-4 @[480px]:grid-cols-4 @[760px]:grid-cols-2">
                        <div className="flex flex-col items-center gap-1">
                            <BrassRing className="w-[72px]">
                                {numberInput("hp_max", t("hp"), cn("w-[2.5ch] text-3xl leading-none", HAND))}
                            </BrassRing>
                            <span className="hydre-display text-center text-sm leading-tight">{t("hp")}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <BrassRing className="w-[72px]">
                                {numberInput("wounds", t("wounds"), cn("w-[2.5ch] text-3xl leading-none", HAND))}
                            </BrassRing>
                            <span className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => set("wounds", Math.max(0, wounds - 1))}
                                    disabled={readOnly || wounds <= 0}
                                    aria-label={t("woundsLess")}
                                    className="h-7 w-7 rounded-sm border border-[color:var(--hydre-brass-dark)]/60 text-base leading-none disabled:opacity-40"
                                >
                                    −
                                </button>
                                <span className="hydre-display text-sm">{t("wounds")}</span>
                                <button
                                    type="button"
                                    onClick={() => set("wounds", wounds + 1)}
                                    disabled={readOnly}
                                    aria-label={t("woundsMore")}
                                    className="h-7 w-7 rounded-sm border border-[color:var(--hydre-brass-dark)]/60 text-base leading-none disabled:opacity-40"
                                >
                                    +
                                </button>
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <BrassRing className="w-[72px]">
                                <span className="flex items-baseline">
                                    {numberInput("protection_melee", t("protectionMelee"), cn("w-[1.6ch] text-2xl leading-none", HAND))}
                                    <span className={cn("text-xl", HAND)}>/</span>
                                    {numberInput("protection_ranged", t("protectionRanged"), cn("w-[1.6ch] text-2xl leading-none", HAND))}
                                </span>
                            </BrassRing>
                            <span className="flex flex-col items-center">
                                <span className="hydre-display text-sm leading-tight">{t("protection")}</span>
                                <span className="text-[11px] leading-tight text-muted-foreground">{t("protectionHint")}</span>
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="flex items-end gap-1">
                                <BrassRing className="w-[72px]">
                                    {numberInput("initiative", t("initiative"), cn("w-[2.5ch] text-3xl leading-none", HAND))}
                                </BrassRing>
                                <span className="hydre-display pb-1 text-sm">{t("initiativeDice")}</span>
                            </span>
                            <span className="hydre-display text-sm leading-tight">{t("initiative")}</span>
                        </div>
                    </div>
                </div>

                {/* Identité */}
                <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                    {line("name", t("name"), "flex-[2_1_16rem]")}
                    {line("concept", t("concept"), "flex-[2_1_14rem]")}
                    {line("age", t("age"), "flex-[1_1_7rem]")}
                </div>

                {/* Phrase de synthèse */}
                <div className="grid grid-cols-1 items-center gap-4 @[640px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <label className="flex min-w-0 flex-col gap-1">
                        <span className="hydre-display text-[15px] uppercase leading-tight">
                            {t("awesome")} <span className="text-xs normal-case">{t("awesomeHint")}</span>
                        </span>
                        {ruled("awesome_because", t("awesome"), 3)}
                    </label>
                    <DecorGear className="hidden h-14 w-14 text-[color:var(--hydre-brass-dark)] @[640px]:block" />
                    <label className="flex min-w-0 flex-col gap-1">
                        <span className="hydre-display text-[15px] uppercase leading-tight">{t("outcast")}</span>
                        {ruled("outcast_because", t("outcast"), 3)}
                    </label>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 @[760px]:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                    <div className="flex min-w-0 flex-col gap-6">
                        {/* Compétences */}
                        <Panel title={t("skills")}>
                            <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_1rem] items-center gap-x-1.5 gap-y-1">
                                <span />
                                <span className="hydre-display text-center text-xs uppercase">{t("total")}</span>
                                <span />
                                {skills.map((field) => {
                                    const label = skillLabel(field.id, field.label);
                                    return (
                                        <label key={field.id} className="contents">
                                            <span className="truncate text-[15px] font-semibold leading-tight">{label}</span>
                                            {numberInput(field.id, label, cn("hydre-box h-7 w-full text-xl leading-none", HAND), 100)}
                                            <span className="text-xs">%</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </Panel>

                        {/* Possessions */}
                        <Panel title={t("possessions")}>
                            {ruled("possessions", t("possessions"), 7)}
                            <label className="mt-3 flex items-center gap-2">
                                <span className="hydre-display text-[15px] uppercase">{t("encumbrance")} :</span>
                                {numberInput("encumbrance", t("encumbrance"), cn("hydre-box h-8 w-14 text-xl leading-none", HAND))}
                            </label>
                        </Panel>
                    </div>

                    <div className="flex min-w-0 flex-col gap-6">
                        {/* Compétences spéciales */}
                        <Panel title={t("special")}>
                            <div className="relative">
                                <DecorGear className="pointer-events-none absolute right-2 top-2 h-32 w-32 text-[color:var(--hydre-brass-dark)] opacity-15" />
                                {ruled("special_abilities", t("special"), 9, "relative")}
                            </div>
                        </Panel>

                        {/* Armes */}
                        <Panel title={t("weapons")}>
                            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.25rem] items-end gap-x-2 gap-y-1.5">
                                {/* Colonne du nom : sans titre, comme sur la fiche papier (chaque champ a son aria-label) */}
                                <span aria-hidden="true" />
                                <span className="hydre-display text-center text-xs uppercase leading-tight">{t("damage")}</span>
                                <span className="hydre-display text-center text-xs uppercase leading-tight">{t("damageBonus")}</span>
                                {weaponRows.map((group, i) => {
                                    const row = t("weaponRow", { n: i + 1 });
                                    return (
                                        <div key={group.id} className="contents">
                                            <input
                                                value={str(`${group.id}_name`)}
                                                onChange={(e) => set(`${group.id}_name`, e.target.value)}
                                                disabled={readOnly}
                                                aria-label={row}
                                                className={cn("hydre-line h-8 min-w-0 px-1 text-xl", HAND)}
                                            />
                                            <input
                                                value={str(`${group.id}_damage`)}
                                                onChange={(e) => set(`${group.id}_damage`, e.target.value)}
                                                disabled={readOnly}
                                                aria-label={`${row} · ${t("damage")}`}
                                                className={cn("hydre-box h-8 w-full text-center text-xl", HAND)}
                                            />
                                            <input
                                                value={str(`${group.id}_bonus`)}
                                                onChange={(e) => set(`${group.id}_bonus`, e.target.value)}
                                                disabled={readOnly}
                                                aria-label={`${row} · ${t("damageBonus")}`}
                                                className={cn("hydre-box h-8 w-full text-center text-xl", HAND)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </Panel>

                        {/* Notes */}
                        <Panel title={t("notes")}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-end gap-3">
                                    <div className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[color:var(--hydre-brass-dark)]/50 bg-[color:var(--hydre-parchment-light)]">
                                        {str("portrait") ? (
                                            <Image src={str("portrait")} alt="" fill unoptimized sizes="80px" className="object-cover sepia-[.35]" />
                                        ) : (
                                            <DecorGear className="h-10 w-10 text-[color:var(--hydre-brass-dark)] opacity-30" spokes={false} />
                                        )}
                                    </div>
                                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="hydre-display text-xs uppercase">{t("portrait")}</span>
                                        <input
                                            value={str("portrait")}
                                            onChange={(e) => set("portrait", e.target.value)}
                                            disabled={readOnly}
                                            placeholder="https://…"
                                            className="hydre-line h-9 min-w-0 text-sm"
                                        />
                                    </label>
                                </div>
                                <label className="flex flex-col gap-1">
                                    <span className="hydre-display text-xs uppercase">{t("description")}</span>
                                    {ruled("description", t("description"), 3)}
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="hydre-display text-xs uppercase">{t("notes")}</span>
                                    {ruled("notes", t("notes"), 5)}
                                </label>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    );
}
