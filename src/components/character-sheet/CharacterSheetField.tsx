"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type FieldType =
    | "text"
    | "number"
    | "textarea"
    | "checkbox"
    | "select"
    | "damage-track"
    | "stress-track"
    | "image";

export type FieldDef = {
    id: string;
    label: string;
    type: FieldType;
    section?: string;
    group?: string | null;
    defaultValue?: unknown;
    options?: string[];
    min?: number | null;
    max?: number | null;
    fullWidth?: boolean;
};

type Props = {
    field: FieldDef;
    value: unknown;
    onChange: (id: string, value: unknown) => void;
    readOnly?: boolean;
};

const DAMAGE_COLORS: Record<string, string> = {
    Hale: "bg-green-500",
    Hurt: "bg-yellow-400",
    Impaired: "bg-orange-500",
    Debilitated: "bg-red-500",
    Dead: "bg-gray-800",
};

export function CharacterSheetField({ field, value, onChange, readOnly = false }: Props) {
    const { id, label, type, options } = field;

    if (type === "text") {
        return (
            <div className="flex flex-col gap-1">
                <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
                <Input
                    id={id}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    disabled={readOnly}
                    className="h-7 text-sm"
                />
            </div>
        );
    }

    if (type === "number") {
        return (
            <div className="flex flex-col gap-1">
                <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
                <Input
                    id={id}
                    type="number"
                    min={field.min ?? undefined}
                    max={field.max ?? undefined}
                    value={(value as number) ?? 0}
                    onChange={(e) => onChange(id, Number(e.target.value))}
                    disabled={readOnly}
                    className="h-7 text-sm w-full"
                />
            </div>
        );
    }

    if (type === "textarea") {
        return (
            <div className="flex flex-col gap-1">
                <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
                <Textarea
                    id={id}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    disabled={readOnly}
                    className="text-sm min-h-[80px] resize-y"
                />
            </div>
        );
    }

    if (type === "checkbox") {
        return (
            <div className="flex items-center gap-2 min-w-0">
                <Switch
                    id={id}
                    checked={(value as boolean) ?? false}
                    onCheckedChange={(checked) => onChange(id, checked)}
                    disabled={readOnly}
                    className="shrink-0"
                />
                <Label htmlFor={id} className="text-xs font-medium truncate">{label}</Label>
            </div>
        );
    }

    if (type === "select") {
        const opts = options ?? [];
        return (
            <div className="flex flex-col gap-1">
                <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
                <select
                    id={id}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    disabled={readOnly}
                    className="h-7 text-sm rounded-md border border-input bg-background px-2 disabled:opacity-70"
                >
                    <option value="">—</option>
                    {opts.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (type === "damage-track") {
        const tracks = options ?? ["Hale", "Hurt", "Impaired", "Debilitated", "Dead"];
        return (
            <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">{label}</Label>
                <div className="grid grid-cols-2 @[300px]:grid-cols-3 @[420px]:grid-cols-5 gap-1.5">
                    {tracks.map((track) => {
                        const active = (value as string) === track;
                        return (
                            <button
                                key={track}
                                type="button"
                                disabled={readOnly}
                                onClick={() => !readOnly && onChange(id, track)}
                                className={`px-2 py-1 rounded text-xs font-semibold border-2 transition-all text-center truncate
                                    ${active
                                        ? `${DAMAGE_COLORS[track] ?? "bg-primary"} text-white border-transparent`
                                        : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-primary"
                                    }
                                    ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}
                                `}
                            >
                                {track}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (type === "stress-track") {
        const count = (value as number) ?? 0;
        const max = field.max ?? 10;
        return (
            <div className="flex flex-wrap items-center gap-3">
                <Label className="text-xs font-medium shrink-0">{label}</Label>
                <div className="flex flex-wrap gap-1">
                    {Array.from({ length: max }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            disabled={readOnly}
                            onClick={() => !readOnly && onChange(id, i + 1 === count ? i : i + 1)}
                            className={`w-5 h-5 rounded-full border-2 transition-colors shrink-0
                                ${i < count ? "bg-destructive border-destructive" : "bg-muted border-muted-foreground/30"}
                                ${readOnly ? "cursor-default" : "cursor-pointer hover:border-destructive"}
                            `}
                        />
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">{count} / {max}</span>
            </div>
        );
    }

    if (type === "image") {
        const url = (value as string) ?? "";
        return (
            <div className="flex flex-col gap-2">
                <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
                <div className="w-full aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center max-w-[120px]">
                    {url
                        ? <img src={url} alt={label} className="w-full h-full object-cover" />
                        : <span className="text-3xl text-muted-foreground">👤</span>
                    }
                </div>
                <Input
                    id={id}
                    value={url}
                    onChange={(e) => onChange(id, e.target.value)}
                    disabled={readOnly}
                    placeholder="https://…"
                    className="h-7 text-sm"
                />
            </div>
        );
    }

    return null;
}
