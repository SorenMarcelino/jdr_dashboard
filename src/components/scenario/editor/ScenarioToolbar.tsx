"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
    Bold, Italic, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Link, UserCircle, StickyNote, Undo2, Redo2,
    Palette, IndentIncrease, IndentDecrease, EyeOff,
} from "lucide-react";

const TEXT_COLORS: { label: string; value: string | null }[] = [
    { label: "Défaut", value: null },
    { label: "Rouge", value: "#ef4444" },
    { label: "Orange", value: "#f97316" },
    { label: "Jaune", value: "#eab308" },
    { label: "Vert", value: "#22c55e" },
    { label: "Bleu", value: "#3b82f6" },
    { label: "Violet", value: "#a855f7" },
    { label: "Rose", value: "#ec4899" },
];

type Props = {
    editor: Editor | null;
    onAddPageLink: () => void;
    onAddNpcRef: () => void;
    onAddAnnotation: () => void;
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

export function ScenarioToolbar({ editor, onAddPageLink, onAddNpcRef, onAddAnnotation }: Props) {
    const [, setTick] = useState(0);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

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
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Gras">
                <Bold size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italique">
                <Italic size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Titres */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Titre 1">
                <Heading1 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Titre 2">
                <Heading2 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Titre 3">
                <Heading3 size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Couleur de texte */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setColorPickerOpen((v) => !v)}
                    isActive={!!editor.getAttributes("textStyle").color}
                    title="Couleur du texte"
                >
                    <Palette size={iconSize} />
                </ToolbarButton>
                {colorPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 bg-background border rounded-md shadow-md z-10">
                        {TEXT_COLORS.map((color) => (
                            <button
                                key={color.label}
                                type="button"
                                title={color.label}
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
            <ToolbarButton onClick={() => editor.chain().focus().increaseIndent().run()} title="Augmenter le retrait (Tab)">
                <IndentIncrease size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().decreaseIndent().run()} title="Diminuer le retrait (Shift+Tab)">
                <IndentDecrease size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Listes */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Liste">
                <List size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Liste numérotée">
                <ListOrdered size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Citation">
                <Quote size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
                <Minus size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleGmOnlyBlock().run()} isActive={editor.isActive("gmOnlyBlock")} title="Bloc MJ uniquement">
                <EyeOff size={iconSize} />
            </ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Annotations spéciales */}
            <ToolbarButton onClick={onAddPageLink} disabled={!hasSelection} title="Lier à une page">
                <Link size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddNpcRef} disabled={!hasSelection} title="Lier un PNJ">
                <UserCircle size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={onAddAnnotation} disabled={!hasSelection} title="Ajouter une note">
                <StickyNote size={iconSize} />
            </ToolbarButton>

            <div className="flex-1" />

            {/* Undo/Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
                <Undo2 size={iconSize} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
                <Redo2 size={iconSize} />
            </ToolbarButton>
        </div>
    );
}
