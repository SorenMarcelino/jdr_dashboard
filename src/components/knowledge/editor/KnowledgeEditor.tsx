// src/components/knowledge/editor/KnowledgeEditor.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import axios from "axios";
import { useTranslations, useFormatter } from "next-intl";
import { useKnowledge } from "@/contexts/KnowledgeContext";
import { Switch } from "@/components/ui/switch";
import { CategoryField } from "../CategoryField";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Props = {
    gameId: string;
};

export function KnowledgeEditor({ gameId }: Props) {
    const { currentEntryId, entries, updateEntryMeta } = useKnowledge();
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [visibleToPlayers, setVisibleToPlayers] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialLoadRef = useRef(false);
    const t = useTranslations("knowledge.editor");
    const format = useFormatter();

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Placeholder.configure({ placeholder: t("contentPlaceholder") }),
        ],
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none px-6 py-4 min-h-[300px] focus:outline-none",
            },
        },
        onUpdate: ({ editor: ed }) => {
            if (!initialLoadRef.current) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                saveField({ content: ed.getJSON() });
            }, 1500);
        },
    });

    const saveField = useCallback(
        async (patch: Record<string, unknown>) => {
            if (!currentEntryId) return;
            setSaving(true);
            try {
                await axios.put(
                    `${API}/games/${gameId}/knowledge-entries/${currentEntryId}`,
                    patch,
                    { withCredentials: true }
                );
                setLastSaved(new Date());
            } catch (err) {
                console.error("Erreur sauvegarde:", err);
            } finally {
                setSaving(false);
            }
        },
        [gameId, currentEntryId]
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    useEffect(() => {
        if (!currentEntryId || !editor) return;
        initialLoadRef.current = false;

        axios
            .get(`${API}/games/${gameId}/knowledge-entries/${currentEntryId}`, {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success && res.data.entry) {
                    const entry = res.data.entry;
                    setTitle(entry.title);
                    setCategory(entry.category || "");
                    setVisibleToPlayers(entry.visibleToPlayers);
                    if (entry.content && entry.content.type === "doc") {
                        editor.commands.setContent(entry.content);
                    } else {
                        editor.commands.clearContent();
                    }
                    setTimeout(() => {
                        initialLoadRef.current = true;
                    }, 50);
                }
            })
            .catch((err) => console.error("Erreur chargement entrée:", err));
    }, [currentEntryId, editor, gameId]);

    const handleTitleChange = useCallback(
        (newTitle: string) => {
            setTitle(newTitle);
            if (!currentEntryId) return;
            updateEntryMeta(currentEntryId, { title: newTitle });
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => saveField({ title: newTitle }), 1500);
        },
        [currentEntryId, saveField, updateEntryMeta]
    );

    const handleCategoryChange = useCallback(
        (newCategory: string) => {
            setCategory(newCategory);
            if (!currentEntryId) return;
            updateEntryMeta(currentEntryId, { category: newCategory });
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => saveField({ category: newCategory }), 1500);
        },
        [currentEntryId, saveField, updateEntryMeta]
    );

    const handleVisibilityChange = useCallback(
        (checked: boolean) => {
            setVisibleToPlayers(checked);
            if (!currentEntryId) return;
            updateEntryMeta(currentEntryId, { visibleToPlayers: checked });
            saveField({ visibleToPlayers: checked });
        },
        [currentEntryId, saveField, updateEntryMeta]
    );

    const categorySuggestions = Array.from(
        new Set(entries.map((e) => e.category).filter((c): c is string => !!c))
    );

    if (!currentEntryId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("selectEntry")}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 pb-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-2xl font-bold w-full bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                    placeholder={t("titlePlaceholder")}
                />
            </div>

            <div className="px-6 pb-2 flex items-center justify-between gap-4">
                <CategoryField value={category} suggestions={categorySuggestions} onChange={handleCategoryChange} />
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{t("visibleToggleLabel")}</span>
                    <Switch checked={visibleToPlayers} onCheckedChange={handleVisibilityChange} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <div className="flex items-center justify-end px-4 py-1.5 border-t text-xs text-muted-foreground">
                {saving ? (
                    <span>{t("saving")}</span>
                ) : lastSaved ? (
                    <span>{t("savedAt", { time: format.dateTime(lastSaved, { hour: "2-digit", minute: "2-digit" }) })}</span>
                ) : null}
            </div>
        </div>
    );
}
