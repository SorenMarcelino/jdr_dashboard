"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type FieldDef = {
    id: string;
    label: string;
    type: "text" | "number" | "textarea" | "checkbox" | "damage-track";
    defaultValue?: unknown;
    options?: string[];
};

type Props = {
    field: FieldDef;
    value: unknown;
    onChange: (id: string, value: unknown) => void;
    readOnly?: boolean;
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

    if (type === "damage-track") {
        const tracks = options ?? ["Hale", "Hurt", "Impaired", "Debilitated", "Dead"];
        const colors: Record<string, string> = {
            Hale: "bg-green-500",
            Hurt: "bg-yellow-400",
            Impaired: "bg-orange-500",
            Debilitated: "bg-red-500",
            Dead: "bg-gray-800",
        };
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
                                        ? `${colors[track] ?? "bg-primary"} text-white border-transparent`
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

    return null;
}
