"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import axios from "axios";
import { useScenario } from "@/contexts/ScenarioContext";
import { ScenarioToolbar } from "./ScenarioToolbar";
import { PageLinkSelector } from "./PageLinkSelector";
import { NpcSelector } from "./NpcSelector";
import { AnnotationPopover } from "./AnnotationPopover";
import { ScenarioPageLinkMark } from "./extensions/ScenarioPageLinkMark";
import { NpcReferenceMark } from "./extensions/NpcReferenceMark";
import { AnnotationMark } from "./extensions/AnnotationMark";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    scenarioId: string;
};

type PopoverType = "pageLink" | "npcRef" | "annotation" | null;

export function ScenarioEditor({ gameId, scenarioId }: Props) {
    const { currentPageId, updatePageTitle } = useScenario();
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [pageTitle, setPageTitle] = useState("");
    const [popover, setPopover] = useState<PopoverType>(null);
    const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialLoadRef = useRef(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Commencez à écrire votre scénario..." }),
            ScenarioPageLinkMark,
            NpcReferenceMark,
            AnnotationMark,
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
                saveContent(ed.getJSON());
            }, 1500);
        },
    });

    const saveContent = useCallback(
        async (content: Record<string, unknown>) => {
            if (!currentPageId) return;
            setSaving(true);
            try {
                await axios.put(
                    `${API}/games/${gameId}/scenarios/${scenarioId}/pages/${currentPageId}`,
                    { content },
                    { withCredentials: true }
                );
                setLastSaved(new Date());
            } catch (err) {
                console.error("Erreur sauvegarde:", err);
            } finally {
                setSaving(false);
            }
        },
        [gameId, scenarioId, currentPageId]
    );

    // Charger le contenu de la page courante
    useEffect(() => {
        if (!currentPageId || !editor) return;
        initialLoadRef.current = false;

        axios
            .get(`${API}/games/${gameId}/scenarios/${scenarioId}/pages/${currentPageId}`, {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success && res.data.page) {
                    const page = res.data.page;
                    setPageTitle(page.title);
                    if (page.content && page.content.type === "doc") {
                        editor.commands.setContent(page.content);
                    } else {
                        editor.commands.clearContent();
                    }
                    setTimeout(() => {
                        initialLoadRef.current = true;
                    }, 50);
                }
            })
            .catch((err) => console.error("Erreur chargement page:", err));
    }, [currentPageId, editor, gameId, scenarioId]);

    const handleTitleChange = useCallback(
        (newTitle: string) => {
            setPageTitle(newTitle);
            if (!currentPageId) return;
            updatePageTitle(currentPageId, newTitle);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(async () => {
                try {
                    await axios.put(
                        `${API}/games/${gameId}/scenarios/${scenarioId}/pages/${currentPageId}`,
                        { title: newTitle },
                        { withCredentials: true }
                    );
                } catch (err) {
                    console.error("Erreur sauvegarde titre:", err);
                }
            }, 1500);
        },
        [currentPageId, gameId, scenarioId, updatePageTitle]
    );

    const openPopover = useCallback(
        (type: PopoverType) => {
            if (!editor) return;
            const { from, to } = editor.state.selection;
            savedSelectionRef.current = { from, to };
            setPopover(type);
        },
        [editor]
    );

    const restoreSelection = useCallback(() => {
        if (!editor || !savedSelectionRef.current) return;
        const { from, to } = savedSelectionRef.current;
        editor.chain().focus().setTextSelection({ from, to }).run();
    }, [editor]);

    const handleAddPageLink = useCallback(
        (pageId: string, pageTitle: string) => {
            if (!editor) return;
            restoreSelection();
            editor
                .chain()
                .focus()
                .setMark("scenarioPageLink", { pageId, label: pageTitle })
                .run();
            savedSelectionRef.current = null;
            setPopover(null);
        },
        [editor, restoreSelection]
    );

    const handleAddNpcRef = useCallback(
        (sheetId: string, npcName: string) => {
            if (!editor) return;
            restoreSelection();
            editor
                .chain()
                .focus()
                .setMark("npcReference", { sheetInstanceId: sheetId, npcName })
                .run();
            savedSelectionRef.current = null;
            setPopover(null);
        },
        [editor, restoreSelection]
    );

    const handleAddAnnotation = useCallback(
        (previewText: string) => {
            if (!editor) return;
            restoreSelection();
            editor
                .chain()
                .focus()
                .setMark("annotation", { previewText })
                .run();
            savedSelectionRef.current = null;
            setPopover(null);
        },
        [editor, restoreSelection]
    );

    if (!currentPageId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Sélectionnez une page dans la barre latérale</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Titre de la page */}
            <div className="px-6 pt-4 pb-2">
                <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-2xl font-bold w-full bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                    placeholder="Titre de la page..."
                />
            </div>

            {/* Toolbar */}
            <ScenarioToolbar
                editor={editor}
                onAddPageLink={() => openPopover("pageLink")}
                onAddNpcRef={() => openPopover("npcRef")}
                onAddAnnotation={() => openPopover("annotation")}
            />

            {/* Éditeur */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            {/* Barre de statut */}
            <div className="flex items-center justify-end px-4 py-1.5 border-t text-xs text-muted-foreground">
                {saving ? (
                    <span>Sauvegarde...</span>
                ) : lastSaved ? (
                    <span>Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                ) : null}
            </div>

            {/* Popovers */}
            {popover === "pageLink" && (
                <PageLinkSelector
                    onSelect={handleAddPageLink}
                    onClose={() => setPopover(null)}
                />
            )}
            {popover === "npcRef" && (
                <NpcSelector
                    gameId={gameId}
                    onSelect={handleAddNpcRef}
                    onClose={() => setPopover(null)}
                />
            )}
            {popover === "annotation" && (
                <AnnotationPopover
                    onConfirm={handleAddAnnotation}
                    onClose={() => setPopover(null)}
                />
            )}
        </div>
    );
}
