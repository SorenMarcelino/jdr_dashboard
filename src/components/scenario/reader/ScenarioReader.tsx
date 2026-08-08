"use client";

import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useScenario } from "@/contexts/ScenarioContext";
import { ScenarioPageLinkMark } from "../editor/extensions/ScenarioPageLinkMark";
import { NpcReferenceMark } from "../editor/extensions/NpcReferenceMark";
import { AnnotationMark } from "../editor/extensions/AnnotationMark";
import { KnowledgeReferenceMark } from "../editor/extensions/KnowledgeReferenceMark";
import { IndentExtension } from "../editor/extensions/IndentExtension";
import { GmOnlyBlock } from "../editor/extensions/GmOnlyBlock";
import { HeadingId } from "../editor/extensions/HeadingId";
import { PageOutline } from "../editor/PageOutline";
import { AnnotationTooltip } from "./AnnotationTooltip";
import { NpcSheetPopover } from "./NpcSheetPopover";
import { KnowledgeEntryPreviewPopover } from "./KnowledgeEntryPreviewPopover";
import { API_URL } from "@/lib/api";

const API = API_URL;

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

type KnowledgePopoverState = {
    entryId: string;
    title: string;
} | null;

export function ScenarioReader({ gameId, scenarioId }: Props) {
    const { currentPageId, navigateToPage } = useScenario();
    const [pageTitle, setPageTitle] = useState("");
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [npcPopover, setNpcPopover] = useState<NpcPopoverState>(null);
    const [knowledgePopover, setKnowledgePopover] = useState<KnowledgePopoverState>(null);
    const t = useTranslations("scenario.editor");
    const tToolbar = useTranslations("scenario.workspace");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, TextStyle, Color, IndentExtension, GmOnlyBlock, HeadingId, ScenarioPageLinkMark, NpcReferenceMark, AnnotationMark, KnowledgeReferenceMark],
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
                const npcName = npcRef.textContent || tToolbar("npc");
                if (sheetId) setNpcPopover({ sheetId, npcName });
                return;
            }

            // Clic sur une référence règle/lore
            const knowledgeRef = target.closest("[data-knowledge-ref]") as HTMLElement | null;
            if (knowledgeRef) {
                const entryId = knowledgeRef.getAttribute("data-knowledge-ref");
                const title = knowledgeRef.textContent || "";
                if (entryId) setKnowledgePopover({ entryId, title });
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

        const knowledgeRef = target.closest("[data-knowledge-ref]") as HTMLElement | null;
        if (knowledgeRef) {
            const previewText = knowledgeRef.getAttribute("data-preview-text");
            if (previewText) {
                const rect = knowledgeRef.getBoundingClientRect();
                setTooltip({ text: previewText, x: rect.left + rect.width / 2, y: rect.top });
            }
        }
    }, [editor]);

    const handleEditorMouseOut = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-annotation]") || target.closest("[data-knowledge-ref]")) {
            setTooltip(null);
        }
    }, []);

    if (!currentPageId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("selectPage")}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 pb-2">
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
            <div className="flex-1 flex min-h-0">
                <div
                    className="flex-1 overflow-y-auto"
                    onClick={handleEditorClick}
                    onMouseOver={handleEditorMouseOver}
                    onMouseOut={handleEditorMouseOut}
                >
                    <EditorContent editor={editor} />
                </div>
                <PageOutline editor={editor} />
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
            {knowledgePopover && (
                <KnowledgeEntryPreviewPopover
                    gameId={gameId}
                    entryId={knowledgePopover.entryId}
                    title={knowledgePopover.title}
                    onClose={() => setKnowledgePopover(null)}
                />
            )}
        </div>
    );
}
