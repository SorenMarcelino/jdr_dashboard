"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronsRight, List } from "lucide-react";

type OutlineEntry = {
    id: string;
    level: number;
    text: string;
};

type Props = {
    editor: Editor | null;
};

function extractOutline(editor: Editor): OutlineEntry[] {
    const entries: OutlineEntry[] = [];
    editor.state.doc.descendants((node) => {
        if (node.type.name !== "heading") return;
        const text = node.textContent;
        if (!text) return;
        entries.push({
            id: (node.attrs.id as string) ?? "",
            level: (node.attrs.level as number) ?? 1,
            text,
        });
    });
    return entries;
}

export function PageOutline({ editor }: Props) {
    const [outline, setOutline] = useState<OutlineEntry[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (!editor) return;
        const update = () => setOutline(extractOutline(editor));
        update();
        editor.on("transaction", update);
        return () => {
            editor.off("transaction", update);
        };
    }, [editor]);

    useEffect(() => {
        if (outline.length === 0) return;
        const headingEls = outline
            .map((entry) => document.getElementById(entry.id))
            .filter((el): el is HTMLElement => Boolean(el));
        if (headingEls.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: "-64px 0px -70% 0px" }
        );
        headingEls.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [outline]);

    if (outline.length === 0) return null;

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                className="w-8 border-l flex items-start justify-center pt-3 hover:bg-muted transition-colors shrink-0"
                title="Afficher le sommaire"
            >
                <List size={14} />
            </button>
        );
    }

    return (
        <div className="w-56 border-l bg-background flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-xs font-semibold text-muted-foreground">Sommaire</span>
                <button
                    onClick={() => setCollapsed(true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Masquer le sommaire"
                >
                    <ChevronsRight size={14} />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
                {outline.map((entry) => (
                    <button
                        key={entry.id}
                        onClick={() =>
                            document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                        className={`block w-full text-left px-3 py-1 text-xs truncate transition-colors ${
                            activeId === entry.id
                                ? "text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ paddingLeft: `${0.75 + (entry.level - 1) * 0.75}rem` }}
                    >
                        {entry.text}
                    </button>
                ))}
            </nav>
        </div>
    );
}
