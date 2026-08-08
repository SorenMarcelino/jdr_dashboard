"use client";

import { useTranslations } from "next-intl";

type Props = {
    value: string;
    suggestions: string[];
    onChange: (value: string) => void;
};

export function CategoryField({ value, suggestions, onChange }: Props) {
    const t = useTranslations("knowledge.editor");

    return (
        <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">{t("categoryLabel")}</label>
            <input
                type="text"
                list="knowledge-category-suggestions"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("categoryPlaceholder")}
                className="flex-1 px-2 py-1 text-xs border rounded bg-background"
            />
            <datalist id="knowledge-category-suggestions">
                {suggestions.map((s) => (
                    <option key={s} value={s} />
                ))}
            </datalist>
        </div>
    );
}
