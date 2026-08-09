"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Props = {
    gameId: string;
    entryId: string;
    title: string;
    onClose: () => void;
};

export function KnowledgeEntryPreviewPopover({ gameId, entryId, title, onClose }: Props) {
    const [entryTitle, setEntryTitle] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const t = useTranslations("knowledge.popover");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, TextStyle, Color],
        editable: false,
        editorProps: {
            attributes: { class: "prose prose-sm dark:prose-invert max-w-none" },
        },
    });

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/knowledge-entries/${entryId}`, { withCredentials: true })
            .then((res) => {
                if (res.data.success && res.data.entry) {
                    setEntryTitle(res.data.entry.title);
                    if (editor && res.data.entry.content?.type === "doc") {
                        editor.commands.setContent(res.data.entry.content);
                    }
                } else {
                    setNotFound(true);
                }
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [gameId, entryId, editor]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background border rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-sm font-bold">{entryTitle || title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <p className="text-xs text-muted-foreground text-center">{t("loading")}</p>
                    ) : notFound ? (
                        <p className="text-xs text-muted-foreground text-center">{t("notFound")}</p>
                    ) : (
                        <EditorContent editor={editor} />
                    )}
                </div>
            </div>
        </div>
    );
}
