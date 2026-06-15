"use client";

import { useState } from "react";
import { CharacterSheetField, FieldDef } from "./CharacterSheetField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type SectionDef = {
    id: string;
    title?: string;
    order?: number;
    columns?: number;
};

export type GroupDef = {
    id: string;
    label?: string;
    section: string;
    order?: number;
    columns?: number;
};

export type Template = {
    name?: string;
    sections?: SectionDef[];
    groups?: GroupDef[];
    fields: FieldDef[];
};

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

// Container-query classes statiques (Tailwind ne supporte pas les classes dynamiques).
const COLUMN_CLASS: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 @[400px]:grid-cols-2",
    3: "grid-cols-1 @[420px]:grid-cols-3",
    4: "grid-cols-2 @[480px]:grid-cols-4",
};

function colClass(columns?: number) {
    return COLUMN_CLASS[columns ?? 2] ?? COLUMN_CLASS[2];
}

function SectionHeading({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">{title}</h3>
            <Separator className="flex-1" />
        </div>
    );
}

export function GenericCharacterSheet({ template, instance, isEditable, onSave }: Props) {
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

    const renderField = (f: FieldDef) => (
        <div key={f.id} className={f.fullWidth ? "col-span-full" : undefined}>
            <CharacterSheetField field={f} value={values[f.id]} onChange={handleChange} readOnly={!isEditable} />
        </div>
    );

    // Sections : explicites si fournies, sinon dérivées de l'ordre d'apparition des champs.
    const sections: SectionDef[] = template.sections?.length
        ? [...template.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [...new Set(template.fields.map((f) => f.section ?? "other"))].map((id) => ({ id }));

    const groups = template.groups ?? [];

    return (
        <div className="@container w-full">
            <div className="flex flex-col gap-4 p-3">
                {template.name && (
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold">{template.name}</span>
                    </div>
                )}

                {sections.map((section) => {
                    const sectionFields = template.fields.filter((f) => (f.section ?? "other") === section.id);
                    if (sectionFields.length === 0) return null;

                    const ungrouped = sectionFields.filter((f) => !f.group);
                    const sectionGroups = groups
                        .filter((g) => g.section === section.id)
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                    return (
                        <section key={section.id} className="flex flex-col gap-3">
                            {section.title && <SectionHeading title={section.title} />}

                            {ungrouped.length > 0 && (
                                <div className={`grid ${colClass(section.columns)} gap-2`}>
                                    {ungrouped.map(renderField)}
                                </div>
                            )}

                            {sectionGroups.length > 0 && (
                                <div className={`grid ${colClass(section.columns)} gap-2`}>
                                    {sectionGroups.map((group) => {
                                        const groupFields = sectionFields.filter((f) => f.group === group.id);
                                        if (groupFields.length === 0) return null;
                                        return (
                                            <div key={group.id} className="@container flex flex-col gap-2 bg-muted/40 rounded-lg p-3 min-w-0">
                                                {group.label && <span className="text-xs font-semibold">{group.label}</span>}
                                                <div className={`grid ${colClass(group.columns)} gap-1.5`}>
                                                    {groupFields.map(renderField)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    );
                })}

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
