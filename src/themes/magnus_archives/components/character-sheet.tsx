"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CharacterSheetProps } from "@/themes/types";

// Fiche Magnus Archives (Cypher System) mise en page comme la fiche papier
// officielle. Elle lit les champs du template « magnus_archives » par leur id
// (cf. back/seeds/magnusArchivesSeed.mjs) : la structure des données est
// inchangée, seule la présentation diffère de GenericCharacterSheet.

const POOLS = ["might", "speed", "intellect"] as const;

const RECOVERY = [
    ["recovery_action", "recoveryAction"],
    ["recovery_10min", "recovery10min"],
    ["recovery_1hour", "recovery1hour"],
    ["recovery_10hours", "recovery10hours"],
] as const;

const DOSSIER = ["background", "arcs", "notes", "equipment"] as const;

const DEFAULT_DAMAGE = ["Hale", "Hurt", "Impaired", "Debilitated", "Dead"];

// Tache d'encre rouge (cf. bloc « Stress » de la fiche papier)
const BLOT_PATH =
    "M50 4 C62 1 69 11 80 13 C93 16 99 29 94 41 C100 52 97 66 88 74 C82 87 67 95 54 90 C41 97 25 92 18 82 C5 76 1 61 6 50 C0 37 8 21 20 16 C30 5 40 8 50 4 Z";

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn("archives-label text-[13px] font-bold uppercase", className)}>{children}</h3>;
}

export function ArchivesCharacterSheet({ template, instance, isEditable, onSave }: CharacterSheetProps) {
    const t = useTranslations("skins.magnus.sheet");
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

    const damageField = template.fields.find((f) => f.id === "damage_track");
    const damageOptions = damageField?.options?.length ? damageField.options : DEFAULT_DAMAGE;
    const damage = str("damage_track") || damageOptions[0];
    const stressMax = template.fields.find((f) => f.id === "stress")?.max ?? 10;
    const stress = num("stress");

    // Blanc de la phrase d'identité : une ligne d'encre et sa légende dessous.
    const blank = (id: string, label: string, opts: { suffix?: string; italic?: boolean; grow?: boolean } = {}) => (
        <label className={cn("inline-flex min-w-0 flex-col", opts.grow && "flex-1 basis-56")}>
            <span className="flex items-baseline">
                <input
                    value={str(id)}
                    onChange={(e) => set(id, e.target.value)}
                    disabled={readOnly}
                    size={Math.max(str(id).length, 8)}
                    className={cn(
                        "archives-line archives-display min-w-0 px-1 text-[length:clamp(1.25rem,2.4cqw,1.85rem)] leading-tight",
                        opts.italic && "italic",
                        opts.grow && "w-full"
                    )}
                />
                {opts.suffix}
            </span>
            <span className="px-1 text-[11px] text-[color:var(--archives-signal-ink)]">{label}</span>
        </label>
    );

    const afterName = t("afterName");
    const nameSuffix = /^\p{P}$/u.test(afterName) ? afterName : undefined;

    const ruled = (id: string, label: ReactNode, rows = 4, labelClass?: string) => (
        <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`mag-${id}`}>
                <SectionLabel className={labelClass}>{label}</SectionLabel>
            </label>
            <textarea
                id={`mag-${id}`}
                value={str(id)}
                onChange={(e) => set(id, e.target.value)}
                disabled={readOnly}
                rows={rows}
                className="archives-ruled archives-text w-full text-sm"
            />
        </div>
    );

    return (
        <div className="@container archives-text w-full">
            {/* Barre du dossier, collée en haut pendant le défilement */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-foreground bg-card px-4 py-2 @[640px]:px-6">
                <span className="text-xs font-bold uppercase">{t("fileTitle")}</span>
                {isEditable && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="archives-label h-9 bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                        {saving ? tc("saving") : tc("save")}
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-6 p-4 @[640px]:p-6">
                {/* « Noor Haddad, méfiante enquêtrice qui lit ce qui ne devrait pas l'être » */}
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2 text-[length:clamp(1.25rem,2.4cqw,1.85rem)]">
                    {blank("name", t("name"), { suffix: nameSuffix })}
                    {!nameSuffix && <span className="archives-display pt-0.5 leading-tight">{afterName}</span>}
                    {blank("descriptor", t("descriptor"))}
                    {blank("type", t("type"))}
                    <span className="archives-display pt-0.5 leading-tight">{t("beforeFocus")}</span>
                    {blank("focus", t("focus"), { italic: true, grow: true })}
                </div>

                {/* Rang / Effort / XP + jets de récupération */}
                <div className="flex flex-wrap border border-foreground">
                    {(["tier", "effort", "xp"] as const).map((id) => (
                        <label key={id} className="flex flex-1 basis-24 flex-col gap-0.5 border-r border-foreground px-4 py-2">
                            <span className="archives-label text-[13px] font-bold uppercase">{t(id)}</span>
                            <input
                                type="number"
                                min={0}
                                value={num(id)}
                                onChange={(e) => set(id, Number(e.target.value))}
                                disabled={readOnly}
                                className="archives-display w-full bg-transparent text-3xl leading-tight outline-none"
                            />
                        </label>
                    ))}
                    <fieldset className="flex flex-[3_1_18rem] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                        <legend className="archives-label float-left w-full text-[13px] font-bold uppercase">{t("recovery")}</legend>
                        {RECOVERY.map(([id, key]) => (
                            <label key={id} className="inline-flex min-h-9 items-center gap-2 text-[13px]">
                                <input
                                    type="checkbox"
                                    checked={Boolean(values[id])}
                                    onChange={(e) => set(id, e.target.checked)}
                                    disabled={readOnly}
                                    className="h-[18px] w-[18px] accent-[color:var(--archives-ink)]"
                                />
                                {t(key)}
                            </label>
                        ))}
                    </fieldset>
                </div>

                {/* Réserves */}
                <div className="grid grid-cols-1 gap-3 @[560px]:grid-cols-3">
                    {POOLS.map((pool) => {
                        const label = t(pool);
                        const current = num(`${pool}_current`);
                        const max = num(`${pool}_max`);
                        const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
                        const step = (delta: number) => {
                            const next = Math.max(0, current + delta);
                            set(`${pool}_current`, max > 0 ? Math.min(max, next) : next);
                        };
                        return (
                            <div key={pool} className="flex min-w-0 flex-col gap-3 border border-foreground px-4 py-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="archives-label text-[17px] font-bold uppercase">{label}</span>
                                    <label className="flex items-baseline gap-1 text-[13px]">
                                        {t("edge")}
                                        <input
                                            type="number"
                                            min={0}
                                            value={num(`${pool}_edge`)}
                                            onChange={(e) => set(`${pool}_edge`, Number(e.target.value))}
                                            disabled={readOnly}
                                            className="archives-line w-[3ch] text-center font-bold"
                                        />
                                    </label>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => step(-1)}
                                        disabled={readOnly}
                                        aria-label={t("decrease", { pool: label })}
                                        className="h-10 w-10 shrink-0 border border-foreground text-xl disabled:opacity-40"
                                    >
                                        −
                                    </button>
                                    <span className="flex min-w-0 items-baseline gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={current}
                                            onChange={(e) => set(`${pool}_current`, Number(e.target.value))}
                                            disabled={readOnly}
                                            aria-label={label}
                                            className="archives-display w-[2.2ch] bg-transparent text-right text-5xl leading-none outline-none"
                                        />
                                        <span className="text-sm">/</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={max}
                                            onChange={(e) => set(`${pool}_max`, Number(e.target.value))}
                                            disabled={readOnly}
                                            aria-label={t("poolMax", { pool: label })}
                                            className="archives-line w-[3.5ch] text-sm"
                                        />
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => step(1)}
                                        disabled={readOnly}
                                        aria-label={t("increase", { pool: label })}
                                        className="h-10 w-10 shrink-0 border border-foreground text-xl disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="h-1.5 bg-foreground/15" aria-hidden="true">
                                    <div className="h-full bg-foreground transition-[width]" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Piste de dégâts + stress */}
                <div className="grid grid-cols-1 items-start gap-6 @[640px]:grid-cols-[3fr_2fr]">
                    <fieldset className="flex min-w-0 flex-col gap-2">
                        <legend className="archives-label pb-2 text-[13px] font-bold uppercase">{t("damageTrack")}</legend>
                        <div className="flex border border-foreground">
                            {damageOptions.map((option) => {
                                const active = option === damage;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => set("damage_track", option)}
                                        disabled={readOnly}
                                        aria-pressed={active}
                                        className={cn(
                                            "archives-label min-h-11 min-w-0 flex-1 truncate border-r border-foreground px-1 text-sm font-semibold last:border-r-0",
                                            active &&
                                                (option === "Dead"
                                                    ? "bg-[color:var(--archives-wound)] text-[color:var(--archives-paper-light)]"
                                                    : "bg-foreground text-[color:var(--archives-paper-light)]")
                                        )}
                                    >
                                        {t.has(`damage.${option}`) ? t(`damage.${option}`) : option}
                                    </button>
                                );
                            })}
                        </div>
                        {t.has(`damageNote.${damage}`) && (
                            <p className="text-[13px] leading-snug">
                                <b>{t(`damage.${damage}`)}.</b> {t(`damageNote.${damage}`)}
                            </p>
                        )}
                    </fieldset>

                    <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-[92px] w-[96px] shrink-0">
                            <svg aria-hidden="true" viewBox="0 0 100 96" className="absolute inset-0 h-full w-full">
                                <path d={BLOT_PATH} fill="var(--archives-wound)" />
                                <circle cx="95" cy="88" r="3" fill="var(--archives-wound)" />
                                <circle cx="7" cy="12" r="2" fill="var(--archives-wound)" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[color:var(--archives-paper-light)]">
                                <span className="archives-label text-xs font-bold uppercase">{t("stress")}</span>
                                <span className="archives-display text-3xl leading-none">{stress}</span>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <SectionLabel>
                                {t("stress")} · {stress} / {stressMax}
                            </SectionLabel>
                            <div className="grid w-max grid-cols-5 gap-1">
                                {Array.from({ length: stressMax }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => set("stress", i + 1 === stress ? i : i + 1)}
                                        disabled={readOnly}
                                        aria-pressed={i < stress}
                                        aria-label={t("stressBox", { n: i + 1 })}
                                        className={cn(
                                            "h-5 w-5 border-[1.5px] border-foreground",
                                            i < stress && "bg-foreground"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compétences */}
                <section className="flex flex-col gap-3">
                    <SectionLabel>{t("skills")}</SectionLabel>
                    <div className="grid grid-cols-1 gap-4 @[560px]:grid-cols-3">
                        {ruled("skills_trained", t("trained"))}
                        {ruled("skills_specialized", t("specialized"))}
                        {ruled("skills_inability", t("inability"), 4, "text-[color:var(--archives-wound)]")}
                    </div>
                </section>

                {/* Capacités spéciales + cyphers */}
                <div className="grid grid-cols-1 gap-6 @[560px]:grid-cols-2">
                    {ruled("special_abilities", t("abilities"), 6)}
                    {ruled("cyphers", t("cyphers"), 6)}
                </div>

                {/* Dossier personnel */}
                <details className="group border-t border-foreground pt-3">
                    <summary className="archives-label cursor-pointer list-none text-[13px] font-bold uppercase">
                        <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
                        {t("dossier")}
                    </summary>
                    <div className="mt-4 grid grid-cols-1 gap-6 @[560px]:grid-cols-2">
                        <div className="flex flex-col gap-2 @[560px]:col-span-2">
                            <label htmlFor="mag-portrait">
                                <SectionLabel>{t("portrait")}</SectionLabel>
                            </label>
                            <div className="flex items-end gap-4">
                                <div className="relative flex h-24 w-20 shrink-0 items-center justify-center border border-foreground bg-muted">
                                    {str("portrait") && (
                                        <Image src={str("portrait")} alt="" fill unoptimized sizes="80px" className="object-cover grayscale" />
                                    )}
                                </div>
                                <input
                                    id="mag-portrait"
                                    value={str("portrait")}
                                    onChange={(e) => set("portrait", e.target.value)}
                                    disabled={readOnly}
                                    placeholder="https://…"
                                    className="archives-line h-9 min-w-0 flex-1 text-sm"
                                />
                            </div>
                        </div>
                        {DOSSIER.map((id) => (
                            <div key={id}>{ruled(id, t(id), 5)}</div>
                        ))}
                    </div>
                </details>
            </div>
        </div>
    );
}
