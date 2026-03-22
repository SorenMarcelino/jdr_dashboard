"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import GridLayout, { Layout } from "react-grid-layout";

type BentoItem = {
    id: string;
    title: string;
    defaultLayout: Omit<Layout, "i">;
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
    children,
}: {
    title: string;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
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
                {headerRight && <div>{headerRight}</div>}
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

    // Charger le layout sauvegardé ou utiliser le défaut
    const defaultLayout: Layout[] = items.map((item) => ({
        i: item.id,
        ...item.defaultLayout,
    }));

    const [layout, setLayout] = useState<Layout[]>(() => {
        if (!storageKey || typeof window === "undefined") return defaultLayout;
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : defaultLayout;
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
        (newLayout: Layout[]) => {
            setLayout(newLayout);
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(newLayout));
            }
        },
        [storageKey]
    );

    if (containerWidth === 0) {
        return <div ref={containerRef} className="h-full w-full" />;
    }

    return (
        <div ref={containerRef} className="h-full w-full overflow-auto">
            <GridLayout
                layout={layout}
                cols={COLS}
                rowHeight={rowHeight}
                width={containerWidth}
                margin={MARGIN}
                containerPadding={[0, 0]}
                draggableHandle=".drag-handle"
                onLayoutChange={handleLayoutChange}
                resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
                isResizable
                isDraggable
            >
                {items.map((item) => (
                    <div key={item.id}>
                        <BentoWidgetShell title={item.title} headerRight={item.headerRight}>
                            {item.content}
                        </BentoWidgetShell>
                    </div>
                ))}
            </GridLayout>
        </div>
    );
}
