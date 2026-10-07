"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetShellProps } from "@/themes/types";

type Surface = "paper" | "paper-light" | "screen";

// Matière de chaque panneau : documents (fiche, transcription) ou écran (scène).
const SURFACE_BY_WIDGET: Record<string, Surface> = {
    sheet: "paper",
    chat: "paper-light",
    stage: "screen",
};

const SURFACE_CLASS: Record<Surface, string> = {
    paper: "bg-card",
    "paper-light": "bg-card archives-paper-light",
    screen: "bg-[color:var(--archives-screen)] text-foreground",
};

const TAB_CLASS: Record<Surface, string> = {
    paper: "bg-card",
    "paper-light": "bg-card archives-paper-light",
    screen: "bg-[color:var(--archives-screen)] text-muted-foreground",
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** Panneau en chemise cartonnée : onglet numéroté (poignée de drag) + matière. */
export function ArchivesWidgetShell({ id, index, title, headerRight, onDetach, detached, children }: WidgetShellProps) {
    const t = useTranslations("skins.magnus");
    const tb = useTranslations("bento");
    const surface = SURFACE_BY_WIDGET[id] ?? "paper";

    if (detached) {
        return <div className={cn("h-full overflow-auto", SURFACE_CLASS[surface])}>{children}</div>;
    }

    return (
        <div className="flex h-full flex-col">
            <div className="drag-handle flex shrink-0 cursor-grab select-none items-end gap-2 pl-3 active:cursor-grabbing">
                <span
                    className={cn(
                        "archives-tab archives-label min-w-0 truncate px-5 pb-1.5 pt-2 text-sm font-semibold",
                        TAB_CLASS[surface]
                    )}
                >
                    <span className="archives-text mr-2 text-xs font-bold">
                        {t("panelIndex", { n: String(index + 1).padStart(2, "0") })}
                    </span>
                    {title}
                </span>
                <div
                    className="ml-auto flex min-w-0 cursor-default items-end gap-1 overflow-x-auto"
                    // La poignée de drag ne doit pas capter les clics des contrôles.
                    onMouseDown={stop}
                    onTouchStart={stop}
                >
                    {headerRight}
                    {onDetach && (
                        <button
                            type="button"
                            onClick={onDetach}
                            className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            title={tb("detach")}
                            aria-label={tb("detachAria", { title })}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className={cn("min-h-0 flex-1 overflow-auto", SURFACE_CLASS[surface])}>{children}</div>
        </div>
    );
}
