"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetShellProps } from "@/themes/types";

type Surface = "paper" | "paper-light" | "leather";

// Matière de chaque panneau : documents (fiche, carnet) ou cuir (scène).
const SURFACE_BY_WIDGET: Record<string, Surface> = {
    sheet: "paper",
    chat: "paper-light",
    stage: "leather",
};

const SURFACE_CLASS: Record<Surface, string> = {
    paper: "bg-card hydre-paper",
    "paper-light": "bg-card hydre-paper-light",
    leather: "bg-[color:var(--hydre-leather)] text-foreground",
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** Panneau encadré de laiton : plaque de titre (poignée de drag) + matière. */
export function HydreWidgetShell({ id, title, headerRight, onDetach, detached, children }: WidgetShellProps) {
    const tb = useTranslations("bento");
    const surface = SURFACE_BY_WIDGET[id] ?? "paper";

    if (detached) {
        return <div className={cn("h-full overflow-auto", SURFACE_CLASS[surface])}>{children}</div>;
    }

    return (
        <div className="flex h-full flex-col">
            <div className="drag-handle flex shrink-0 cursor-grab select-none items-end gap-2 pb-1 pl-2 active:cursor-grabbing">
                <span className="hydre-plaque min-w-0 max-w-[70%]">
                    <span className="hydre-display truncate px-5 py-1 text-[15px] uppercase leading-tight tracking-wide">{title}</span>
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
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-[color:var(--hydre-brass-light)]"
                            title={tb("detach")}
                            aria-label={tb("detachAria", { title })}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            <div
                className={cn(
                    "relative min-h-0 flex-1 overflow-auto rounded-sm border-2 border-[color:var(--hydre-brass-dark)] shadow-[inset_0_0_0_1px_var(--hydre-brass),0_4px_14px_rgba(0,0,0,0.45)]",
                    SURFACE_CLASS[surface]
                )}
            >
                {children}
            </div>
        </div>
    );
}
