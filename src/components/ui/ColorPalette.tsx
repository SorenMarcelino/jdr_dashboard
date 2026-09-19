"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Ban, Plus, X } from "lucide-react";
import { DEFAULT_COLORS, normalizeHex } from "@/lib/colors";
import { useSavedColors } from "@/hooks/use-saved-colors";

type Props = {
    value: string | null;
    onChange: (color: string | null) => void;
};

function Swatch({
    color,
    title,
    selected,
    onSelect,
}: {
    color: string | null;
    title: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={selected}
            // preventDefault : garde la sélection de l'éditeur
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSelect}
            className={`flex h-5 w-5 items-center justify-center rounded-full border border-border ${
                selected ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
            }`}
            style={{ backgroundColor: color ?? "transparent" }}
        >
            {color === null && <Ban size={12} className="text-muted-foreground" />}
        </button>
    );
}

// Palette réutilisable : couleurs par défaut, couleurs sauvegardées de
// l'utilisateur, et « + » pour en choisir une nouvelle (qui est sauvegardée).
export function ColorPalette({ value, onChange }: Props) {
    const t = useTranslations("common.colorPalette");
    const { colors: saved, addColor, removeColor } = useSavedColors();
    const inputRef = useRef<HTMLInputElement>(null);
    const current = normalizeHex(value);

    // Événement natif `change` (et non `input`, que React expose en onChange) :
    // il ne part qu'une fois, à la fermeture du sélecteur du système.
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        const onCommit = () => {
            const hex = normalizeHex(input.value);
            if (!hex) return;
            addColor(hex);
            onChange(hex);
        };
        input.addEventListener("change", onCommit);
        return () => input.removeEventListener("change", onCommit);
    }, [addColor, onChange]);

    return (
        <div className="flex w-[196px] flex-col gap-2">
            <div className="flex flex-wrap gap-1">
                <Swatch color={null} title={t("default")} selected={current === null} onSelect={() => onChange(null)} />
                {DEFAULT_COLORS.map((c) => (
                    <Swatch
                        key={c.key}
                        color={c.value}
                        title={t(c.key)}
                        selected={current === c.value}
                        onSelect={() => onChange(c.value)}
                    />
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {saved.map((hex) => (
                    <div key={hex} className="group relative">
                        <Swatch color={hex} title={hex} selected={current === hex} onSelect={() => onChange(hex)} />
                        <button
                            type="button"
                            title={t("remove", { color: hex })}
                            aria-label={t("remove", { color: hex })}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => removeColor(hex)}
                            className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full border bg-background group-hover:flex"
                        >
                            <X size={8} />
                        </button>
                    </div>
                ))}
                <label
                    title={t("add")}
                    className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-dashed border-border hover:bg-muted"
                >
                    <Plus size={12} />
                    <input
                        ref={inputRef}
                        type="color"
                        aria-label={t("add")}
                        defaultValue={current ?? "#888888"}
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />
                </label>
            </div>
        </div>
    );
}
