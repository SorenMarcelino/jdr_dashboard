"use client";

import { useState } from "react";
import { CharacterSheetField, FieldDef } from "./CharacterSheetField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Template = { fields: FieldDef[] };

type Instance = {
    _id?: string;
    systemId: string;
    values: Record<string, unknown>;
};

type Props = {
    template: Template;
    instance: Instance | null;
    isEditable: boolean;
    onSave: (values: Record<string, unknown>) => Promise<void>;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">{title}</h3>
                <Separator className="flex-1" />
            </div>
            {children}
        </div>
    );
}

export function MagnusArchivesSheet({ template, instance, isEditable, onSave }: Props) {
    const defaultValues = Object.fromEntries(
        template.fields.map((f) => [f.id, f.defaultValue ?? null])
    );
    const [values, setValues] = useState<Record<string, unknown>>(
        instance?.values ? Object.fromEntries(Object.entries(instance.values)) : defaultValues
    );
    const [saving, setSaving] = useState(false);

    const handleChange = (id: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try { await onSave(values); }
        finally { setSaving(false); }
    };

    const bySection = template.fields.reduce<Record<string, FieldDef[]>>((acc, f) => {
        (acc[f.section ?? "other"] ??= []).push(f);
        return acc;
    }, {});

    const field = (id: string) => {
        const f = template.fields.find((x) => x.id === id);
        if (!f) return null;
        return <CharacterSheetField field={f} value={values[id]} onChange={handleChange} readOnly={!isEditable} />;
    };

    const fields = (section: string) =>
        (bySection[section] ?? []).map((f) => (
            <CharacterSheetField key={f.id} field={f} value={values[f.id]} onChange={handleChange} readOnly={!isEditable} />
        ));

    const poolBlock = (name: string, prefix: string) => (
        <div className="@container flex flex-col gap-2 bg-muted/40 rounded-lg p-3 min-w-0">
            <span className="text-xs font-semibold">{name}</span>
            <div className="grid grid-cols-1 @[140px]:grid-cols-3 gap-1.5">
                {field(`${prefix}_current`)}
                {field(`${prefix}_max`)}
                {field(`${prefix}_edge`)}
            </div>
        </div>
    );

    const portrait = values["portrait"] as string;
    const stressVal = (values["stress"] as number) ?? 0;

    return (
        /* @container : toute la fiche devient un container CSS */
        <div className="@container w-full">
            <div className="flex flex-col gap-4 p-3">

                {/* ── En-tête ── */}
                <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-sm font-bold">Magnus Archives</span>
                        <span className="text-xs text-muted-foreground">Cypher System</span>
                    </div>
                    {/* 2 col par défaut → 4 col à partir de 480px container */}
                    <div className="grid grid-cols-2 @[480px]:grid-cols-4 gap-2">
                        {fields("header")}
                    </div>
                </div>

                {/* ── Pools ── */}
                <Section title="Pools">
                    {/* 1 col → 3 col à 420px */}
                    <div className="grid grid-cols-1 @[420px]:grid-cols-3 gap-2">
                        {poolBlock("Might", "might")}
                        {poolBlock("Speed", "speed")}
                        {poolBlock("Intellect", "intellect")}
                    </div>
                </Section>

                {/* ── Compétences ── */}
                <Section title="Compétences">
                    {/* 1 col → 3 col à 500px */}
                    <div className="grid grid-cols-1 @[500px]:grid-cols-3 gap-2">
                        {fields("skills")}
                    </div>
                </Section>

                {/* ── Capacités spéciales ── */}
                <Section title="Capacités spéciales">
                    <div className="flex flex-col gap-2">{fields("abilities")}</div>
                </Section>

                {/* ── Récupération & Piste de dégâts ── */}
                <Section title="Récupération">
                    <div className="flex flex-col gap-3">
                        {/* Checkboxes : 2 col par défaut → 4 col à 500px */}
                        <div className="grid grid-cols-2 @[500px]:grid-cols-4 gap-x-3 gap-y-2">
                            {(bySection["recovery"] ?? [])
                                .filter((f) => f.type === "checkbox")
                                .map((f) => (
                                    <CharacterSheetField key={f.id} field={f} value={values[f.id]} onChange={handleChange} readOnly={!isEditable} />
                                ))}
                        </div>
                        {/* Damage track — le @container est sur le wrapper global, les boutons grident en container queries */}
                        {(bySection["recovery"] ?? [])
                            .filter((f) => f.type === "damage-track")
                            .map((f) => (
                                <CharacterSheetField key={f.id} field={f} value={values[f.id]} onChange={handleChange} readOnly={!isEditable} />
                            ))}
                    </div>
                </Section>

                {/* ── Stress ── */}
                <Section title="Stress">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="w-20 shrink-0">{field("stress")}</div>
                        {/* Bulles stress — wrappent si besoin */}
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!isEditable}
                                    onClick={() => isEditable && handleChange("stress", i + 1 === stressVal ? i : i + 1)}
                                    className={`w-5 h-5 rounded-full border-2 transition-colors shrink-0
                                        ${i < stressVal ? "bg-destructive border-destructive" : "bg-muted border-muted-foreground/30"}
                                        ${isEditable ? "cursor-pointer hover:border-destructive" : "cursor-default"}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Cyphers ── */}
                <Section title="Cyphers">
                    <div className="flex flex-col gap-2">{fields("cyphers")}</div>
                </Section>

                {/* ── Background ── */}
                <Section title="Background & Notes">
                    {/* Portrait + champs : colonne unique → côte à côte à 480px */}
                    <div className="grid grid-cols-1 @[480px]:grid-cols-[120px_1fr] gap-3">
                        {/* Portrait */}
                        <div className="flex flex-col gap-2">
                            <div className="w-full aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center max-w-[120px]">
                                {portrait
                                    ? <img src={portrait} alt="Portrait" className="w-full h-full object-cover" />
                                    : <span className="text-3xl text-muted-foreground">👤</span>
                                }
                            </div>
                            {field("portrait")}
                        </div>

                        {/* Textareas : 1 col → 2 col à 600px container */}
                        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-2">
                            {(bySection["background"] ?? [])
                                .filter((f) => f.id !== "portrait")
                                .map((f) => (
                                    <CharacterSheetField key={f.id} field={f} value={values[f.id]} onChange={handleChange} readOnly={!isEditable} />
                                ))}
                        </div>
                    </div>
                </Section>

                {/* ── Sauvegarder ── */}
                {isEditable && (
                    <div className="flex justify-end pt-1">
                        <Button onClick={handleSave} disabled={saving} size="sm">
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
