// src/components/knowledge/reader/KnowledgeReader.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";

const API = API_URL;

type EntrySummary = {
    _id: string;
    title: string;
    category: string;
};

type Props = {
    gameId: string;
    type: "rule" | "lore";
};

export function KnowledgeReader({ gameId, type }: Props) {
    const [entries, setEntries] = useState<EntrySummary[]>([]);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("knowledge.reader");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, TextStyle, Color],
        editable: false,
        editorProps: {
            attributes: { class: "prose prose-sm dark:prose-invert max-w-none px-6 py-4" },
        },
    });

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/knowledge-entries`, {
                params: { type },
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success) {
                    const list: EntrySummary[] = res.data.entries || [];
                    setEntries(list);
                    if (list.length > 0) setCurrentEntryId(list[0]._id);
                }
            })
            .catch((err) => console.error("Erreur chargement:", err))
            .finally(() => setLoading(false));
    }, [gameId, type]);

    useEffect(() => {
        if (!currentEntryId || !editor) return;
        axios
            .get(`${API}/games/${gameId}/knowledge-entries/${currentEntryId}`, {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success && res.data.entry?.content?.type === "doc") {
                    editor.commands.setContent(res.data.entry.content);
                } else {
                    editor.commands.clearContent();
                }
            })
            .catch((err) => console.error("Erreur chargement entrée:", err));
    }, [currentEntryId, editor, gameId]);

    const selectEntry = useCallback((id: string) => setCurrentEntryId(id), []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("loading")}</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("empty")}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex min-h-0">
            <div className="w-64 border-r bg-background flex flex-col shrink-0 overflow-y-auto p-2 space-y-0.5">
                {entries.map((entry) => (
                    <button
                        key={entry._id}
                        onClick={() => selectEntry(entry._id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            entry._id === currentEntryId
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted text-foreground"
                        }`}
                    >
                        {entry.title}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
