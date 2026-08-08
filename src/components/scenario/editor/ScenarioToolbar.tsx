"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import {
    Bold, Italic, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Link, UserCircle, StickyNote, Undo2, Redo2,
    Palette, IndentIncrease, IndentDecrease, EyeOff, ScrollText, Landmark,
} from "lucide-react";

const TEXT_COLOR_KEYS: { key: string; value: string | null }[] = [
    { key: "colorDefault", value: null },
    { key: "colorRed", value: "#ef4444" },
    { key: "colorOrange", value: "#f97316" },
    { key: "colorYellow", value: "#eab308" },
    { key: "colorGreen", value: "#22c55e" },
    { key: "colorBlue", value: "#3b82f6" },
    { key: "colorPurple", value: "#a855f7" },
    { key: "colorPink", value: "#ec4899" },
];

type Props = {
    editor: Editor | null;
    onAddPageLink: () => void;
    onAddNpcRef: () => void;
    onAddAnnotation: () => void;
    onAddRuleRef: () => void;
    onAddLoreRef: () => void;
};

function ToolbarButton({
    onClick,
    isActive,
    disabled,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                if (!disabled) onClick();
            }}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
            } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
        >
            {children}
        </button>
    );
}

export function ScenarioToolbar({ editor, onAddPageLink, onAddNpcRef, onAddAnnotation, onAddRuleRef, onAddLoreRef }: Props) {
    const [, setTick] = useState(0);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const t = useTranslations("scenario.toolbar");

    useEffect(() => {
        if (!editor) return;
        const forceUpdate = () => setTick((t) => t + 1);
        editor.on("selectionUpdate", forceUpdate);
        editor.on("transaction", forceUpdate);
        return () => {
            editor.off("selectionUpdate", forceUpdate);
            editor.off("transaction", forceUpdate);
        };
    }, [editor]);

    if (!editor) return null;

    const hasSelection = !editor.state.selection.empty;
    const iconSize = 16;

    return (
        <div className="flex items-center gap-0.5 flex-wrap border-b bg-background px-2 py-1">
            {/* Formatage de base */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title={t("bold")}>
                <Bold size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title={t("italic")}>
                <Italic size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Titres */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title={t("heading1")}>
                <Heading1 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title={t("heading2")}>
                <Heading2 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title={t("heading3")}>
                <Heading3 size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Couleur de texte */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setColorPickerOpen((v) => !v)}
                    isActive={!!editor.getAttributes("textStyle").color}
                    title={t("textColor")}
                >
                    <Palette size={iconSize} />
                </ToolbarButton>
                {colorPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 bg-background border rounded-md shadow-md z-10">
                        {TEXT_COLOR_KEYS.map((color) => (
                            <button
                                key={color.key}
                                type="button"
                                title={t(color.key)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (color.value === null) {
                                        editor.chain().focus().unsetColor().run();
                                    } else {
                                        editor.chain().focus().setColor(color.value).run();
                                    }
                                    setColorPickerOpen(false);
                                }}
                                className="w-5 h-5 rounded-full border border-border"
                                style={{ backgroundColor: color.value ?? "transparent" }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Retrait */}
            <ToolbarButton onClick={() => editor.chain().focus().increaseIndent().run()} title={t("increaseIndent")}>
                <IndentIncrease size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().decreaseIndent().run()} title={t("decreaseIndent")}>
                <IndentDecrease size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Listes */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title={t("bulletList")}>
                <List size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title={t("orderedList")}>
                <ListOrdered size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title={t("quote")}>
                <Quote size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title={t("divider")}>
                <Minus size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleGmOnlyBlock().run()} isActive={editor.isActive("gmOnlyBlock")} title={t("gmOnlyBlock")}>
                <EyeOff size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Annotations spéciales */}
            <ToolbarButton onClick={onAddPageLink} disabled={!hasSelection} title={t("pageLink")}>
                <Link size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddNpcRef} disabled={!hasSelection} title={t("npcLink")}>
                <UserCircle size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddAnnotation} disabled={!hasSelection} title={t("annotation")}>
                <StickyNote size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddRuleRef} disabled={!hasSelection} title={t("linkRule")}>
                <ScrollText size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddLoreRef} disabled={!hasSelection} title={t("linkLore")}>
                <Landmark size={iconSize} />
            </ToolbarButton>

            <div className="flex-1" />

            {/* Undo/Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title={t("undo")}>
                <Undo2 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title={t("redo")}>
                <Redo2 size={iconSize} />
            </ToolbarButton>
        </div>
    );
}
