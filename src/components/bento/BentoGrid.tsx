"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GridLayout, type Layout, type LayoutItem } from "react-grid-layout";
import { DetachedWindowPortal } from "@/hooks/use-detached-window";
import { useTranslations } from "next-intl";

type BentoItem = {
    id: string;
    title: string;
    defaultLayout: Omit<LayoutItem, "i">;
    content: React.ReactNode;
    headerRight?: React.ReactNode;
};

type Props = {
    items: BentoItem[];
    storageKey?: string;
};

const COLS = 12;
const MARGIN: [number, number] = [8, 8];

function BentoWidgetShell({
    title,
    headerRight,
    onDetach,
    children,
}: {
    title: string;
    headerRight?: React.ReactNode;
    onDetach?: () => void;
    children: React.ReactNode;
}) {
    const t = useTranslations("bento");

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="drag-handle shrink-0 flex items-center justify-between px-3 py-2 border-b bg-muted/40 cursor-grab active:cursor-grabbing select-none">
                <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/60">
                        <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
                        <circle cx="16" cy="6" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="18" r="1.5" fill="currentColor"/>
                        <circle cx="16" cy="18" r="1.5" fill="currentColor"/>
                    </svg>
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {headerRight && <div>{headerRight}</div>}
                    {onDetach && (
                        <button
                            onClick={onDetach}
                            // Empêche le drag-handle de capter le clic.
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-accent cursor-pointer"
                            title={t("detach")}
                            aria-label={t("detachAria", { title })}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
                {children}
            </div>
        </div>
    );
}

export function BentoGrid({ items, storageKey }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [rowHeight, setRowHeight] = useState(60);
    // Widgets détachés dans une fenêtre navigateur : retirés du grid (qui
    // reflow) et rendus via DetachedWindowPortal. Fermer la fenêtre les
    // réintègre à leur place (leur layout est conservé).
    const [detachedIds, setDetachedIds] = useState<Set<string>>(new Set());

    // Charger le layout sauvegardé ou utiliser le défaut
    const defaultLayout: LayoutItem[] = items.map((item) => ({
        i: item.id,
        ...item.defaultLayout,
    }));

    const [layout, setLayout] = useState<LayoutItem[]>(() => {
        if (!storageKey || typeof window === "undefined") return defaultLayout;
        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return defaultLayout;
            // Réconcilie le layout sauvegardé avec les items actuels : les
            // widgets disparus sont retirés, les nouveaux (ex : ajoutés par
            // une mise à jour de l'app) reçoivent leur layout par défaut.
            const parsed: LayoutItem[] = JSON.parse(saved);
            const ids = new Set(items.map((item) => item.id));
            const kept = parsed.filter((l) => ids.has(l.i));
            const missing = defaultLayout.filter(
                (l) => !kept.some((k) => k.i === l.i)
            );
            return [...kept, ...missing];
        } catch {
            return defaultLayout;
        }
    });

    // Observer la largeur du conteneur
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            setContainerWidth(el.offsetWidth);
            // Adapter la hauteur des lignes à la fenêtre disponible
            const availableH = el.offsetHeight;
            const maxRow = Math.max(...layout.map((l) => l.y + l.h), 1);
            const rh = Math.floor((availableH - MARGIN[1] * (maxRow + 1)) / maxRow);
            setRowHeight(Math.max(rh, 40));
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [layout]);

    const handleLayoutChange = useCallback(
        (newLayout: Layout) => {
            // Le grid ne connaît que les widgets visibles : on réinjecte les
            // layouts des widgets détachés pour ne pas les perdre (ni en état
            // ni en localStorage) — ils reprennent leur place au re-dock.
            setLayout((prev) => {
                const detachedEntries = prev.filter((l) => detachedIds.has(l.i));
                const merged = [...newLayout, ...detachedEntries];
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(merged));
                }
                return merged;
            });
        },
        [storageKey, detachedIds]
    );

    const detachItem = useCallback((id: string) => {
        setDetachedIds((prev) => new Set(prev).add(id));
    }, []);

    const reattachItem = useCallback((id: string) => {
        setDetachedIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    if (containerWidth === 0) {
        return <div ref={containerRef} className="h-full w-full" />;
    }

    const dockedItems = items.filter((item) => !detachedIds.has(item.id));
    const detachedItems = items.filter((item) => detachedIds.has(item.id));

    return (
        <div ref={containerRef} className="h-full w-full overflow-auto">
            <GridLayout
                layout={layout.filter((l) => !detachedIds.has(l.i))}
                width={containerWidth}
                gridConfig={{
                    cols: COLS,
                    rowHeight,
                    margin: MARGIN,
                    containerPadding: [0, 0],
                }}
                dragConfig={{
                    handle: ".drag-handle",
                }}
                resizeConfig={{
                    handles: ["se", "sw", "ne", "nw", "e", "w", "n", "s"],
                }}
                onLayoutChange={handleLayoutChange}
            >
                {dockedItems.map((item) => (
                    <div key={item.id}>
                        <BentoWidgetShell
                            title={item.title}
                            headerRight={item.headerRight}
                            onDetach={() => detachItem(item.id)}
                        >
                            {item.content}
                        </BentoWidgetShell>
                    </div>
                ))}
            </GridLayout>

            {/* Widgets détachés : rendus dans leur propre fenêtre navigateur,
                React reste réconcilié depuis la fenêtre parente. */}
            {detachedItems.map((item) => (
                <DetachedWindowPortal
                    key={item.id}
                    title={item.title}
                    onClose={() => reattachItem(item.id)}
                >
                    <div className="h-full bg-background text-foreground overflow-auto">
                        {item.content}
                    </div>
                </DetachedWindowPortal>
            ))}
        </div>
    );
}
