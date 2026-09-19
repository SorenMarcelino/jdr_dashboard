"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ColorPalette } from "@/components/ui/ColorPalette";
import { Input } from "@/components/ui/input";
import { useDismiss } from "@/hooks/use-dismiss";
import { normalizeHex } from "@/lib/colors";
import {
    DEFAULT_GM_EMOJI,
    GM_EMOJI_PRESETS,
    GM_LABEL_MAX,
    normalizeGmEmoji,
    normalizeGmLabel,
} from "./gmOnlyAttrs";

type Attrs = { color: string | null; emoji: string | null; label: string | null };

function GmOnlySettings({
    attrs,
    onChange,
}: {
    attrs: Attrs;
    onChange: (patch: Partial<Attrs>) => void;
}) {
    const t = useTranslations("scenario.gmOnly");
    // Brouillon local : l'attribut est normalisé (trim) à chaque frappe,
    // l'input doit pouvoir afficher l'espace qu'on est en train de taper.
    const [labelDraft, setLabelDraft] = useState(attrs.label ?? "");
    const emoji = attrs.emoji ?? DEFAULT_GM_EMOJI;

    return (
        <div className="not-prose absolute left-0 top-full z-20 mt-1 w-60 space-y-3 rounded-md border bg-background p-3 text-foreground shadow-md">
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("color")}</p>
                <ColorPalette value={attrs.color} onChange={(color) => onChange({ color })} />
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("emoji")}</p>
                <div className="grid grid-cols-6 gap-1">
                    {GM_EMOJI_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => onChange({ emoji: preset === DEFAULT_GM_EMOJI ? null : preset })}
                            className={`h-7 rounded text-base hover:bg-muted ${
                                preset === emoji ? "bg-muted ring-1 ring-ring" : ""
                            }`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
                <Input
                    className="mt-2 h-8"
                    placeholder={t("customEmoji")}
                    maxLength={16}
                    onChange={(e) => {
                        const value = normalizeGmEmoji(e.target.value);
                        if (value) onChange({ emoji: value === DEFAULT_GM_EMOJI ? null : value });
                    }}
                />
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("text")}</p>
                <Input
                    className="h-8"
                    value={labelDraft}
                    placeholder={t("defaultLabel")}
                    maxLength={GM_LABEL_MAX}
                    onChange={(e) => {
                        setLabelDraft(e.target.value);
                        onChange({ label: normalizeGmLabel(e.target.value) });
                    }}
                />
            </div>
            <button
                type="button"
                onClick={() => {
                    setLabelDraft("");
                    onChange({ color: null, emoji: null, label: null });
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <RotateCcw size={12} />
                {t("reset")}
            </button>
        </div>
    );
}

// Rendu du bloc MJ, partagé par l'éditeur et le lecteur. La pastille n'est
// cliquable que si l'éditeur est éditable.
export function GmOnlyBlockView({ node, editor, updateAttributes }: NodeViewProps) {
    const t = useTranslations("scenario.gmOnly");
    const [open, setOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(headerRef, open, close);

    const attrs: Attrs = {
        color: normalizeHex(node.attrs.color),
        emoji: normalizeGmEmoji(node.attrs.emoji),
        label: normalizeGmLabel(node.attrs.label),
    };
    const pillText = `${attrs.emoji ?? DEFAULT_GM_EMOJI} ${attrs.label ?? t("defaultLabel")}`;
    const style = attrs.color ? ({ "--gm-color": attrs.color } as CSSProperties) : undefined;

    return (
        <NodeViewWrapper className="scenario-gm-only-block" data-gm-only="true" style={style}>
            <div ref={headerRef} contentEditable={false} className="scenario-gm-only-header not-prose">
                {editor.isEditable ? (
                    <button
                        type="button"
                        title={t("customize")}
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                        className="scenario-gm-only-pill"
                    >
                        {pillText}
                    </button>
                ) : (
                    <span className="scenario-gm-only-pill">{pillText}</span>
                )}
                {open && editor.isEditable && (
                    <GmOnlySettings attrs={attrs} onChange={(patch) => updateAttributes(patch)} />
                )}
            </div>
            <NodeViewContent />
        </NodeViewWrapper>
    );
}
