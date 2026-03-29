"use client";

import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import { useScenario } from "@/contexts/ScenarioContext";
import { ScenarioPageLinkMark } from "../editor/extensions/ScenarioPageLinkMark";
import { NpcReferenceMark } from "../editor/extensions/NpcReferenceMark";
import { AnnotationMark } from "../editor/extensions/AnnotationMark";
import { AnnotationTooltip } from "./AnnotationTooltip";
import { NpcSheetPopover } from "./NpcSheetPopover";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    scenarioId: string;
};

type TooltipState = {
    text: string;
    x: number;
    y: number;
} | null;

type NpcPopoverState = {
    sheetId: string;
    npcName: string;
} | null;

export function ScenarioReader({ gameId, scenarioId }: Props) {
    const { currentPageId, navigateToPage } = useScenario();
    const [pageTitle, setPageTitle] = useState("");
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [npcPopover, setNpcPopover] = useState<NpcPopoverState>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, ScenarioPageLinkMark, NpcReferenceMark, AnnotationMark],
        editable: false,
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none px-6 py-4",
            },
        },
    });

    // Charger la page courante
    useEffect(() => {
        if (!currentPageId || !editor) return;
        axios
            .get(`${API}/games/${gameId}/scenarios/${scenarioId}/pages/${currentPageId}`, {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success && res.data.page) {
                    setPageTitle(res.data.page.title);
                    if (res.data.page.content?.type === "doc") {
                        editor.commands.setContent(res.data.page.content);
                    } else {
                        editor.commands.clearContent();
                    }
                }
            })
            .catch((err) => console.error("Erreur chargement:", err));
    }, [currentPageId, editor, gameId, scenarioId]);

    // Gestion des clics et survols sur les annotations
    const handleEditorClick = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;

            // Clic sur un lien de page
            const pageLink = target.closest("[data-page-link]") as HTMLElement | null;
            if (pageLink) {
                const pageId = pageLink.getAttribute("data-page-link");
                if (pageId) navigateToPage(pageId);
                return;
            }

            // Clic sur une référence PNJ
            const npcRef = target.closest("[data-npc-ref]") as HTMLElement | null;
            if (npcRef) {
                const sheetId = npcRef.getAttribute("data-npc-ref");
                const npcName = npcRef.textContent || "PNJ";
                if (sheetId) setNpcPopover({ sheetId, npcName });
                return;
            }
        },
        [navigateToPage]
    );

    const handleEditorMouseOver = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const annotation = target.closest("[data-annotation]") as HTMLElement | null;
        if (annotation) {
            const previewText = annotation.getAttribute("data-preview-text") ||
                editor?.getAttributes("annotation")?.previewText;

            // Chercher l'attribut previewText dans le mark TipTap
            if (!previewText) {
                // Fallback: chercher dans les marks de l'éditeur via le DOM
                const span = annotation as HTMLSpanElement;
                const text = span.getAttribute("previewtext") || span.dataset.previewText;
                if (text) {
                    const rect = annotation.getBoundingClientRect();
                    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top });
                }
                return;
            }

            const rect = annotation.getBoundingClientRect();
            setTooltip({ text: previewText, x: rect.left + rect.width / 2, y: rect.top });
        }
    }, [editor]);

    const handleEditorMouseOut = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-annotation]")) {
            setTooltip(null);
        }
    }, []);

    if (!currentPageId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Sélectionnez une page dans la barre latérale</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 pb-2">
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
            <div
                className="flex-1 overflow-y-auto"
                onClick={handleEditorClick}
                onMouseOver={handleEditorMouseOver}
                onMouseOut={handleEditorMouseOut}
            >
                <EditorContent editor={editor} />
            </div>

            {tooltip && <AnnotationTooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
            {npcPopover && (
                <NpcSheetPopover
                    gameId={gameId}
                    sheetId={npcPopover.sheetId}
                    npcName={npcPopover.npcName}
                    onClose={() => setNpcPopover(null)}
                />
            )}
        </div>
    );
}
