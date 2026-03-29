"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
    Bold, Italic, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Link, UserCircle, StickyNote, Undo2, Redo2,
} from "lucide-react";

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
