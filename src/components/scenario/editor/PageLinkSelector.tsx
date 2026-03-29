"use client";

import { useState } from "react";
import { useScenario } from "@/contexts/ScenarioContext";
import { Search } from "lucide-react";

type Props = {
    onSelect: (pageId: string, pageTitle: string) => void;
    onClose: () => void;
};

export function PageLinkSelector({ onSelect, onClose }: Props) {
    const { pages, currentPageId } = useScenario();
    const [search, setSearch] = useState("");

    const filtered = pages.filter(
        (p) =>
            p._id !== currentPageId &&
            p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background border rounded-lg shadow-lg w-80 max-h-96 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-3 border-b">
                    <h3 className="text-sm font-semibold mb-2">Lier à une page</h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="Rechercher une page..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded bg-background"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Aucune page trouvée</p>
                    ) : (
                        filtered.map((page) => (
                            <button
                                key={page._id}
                                onClick={() => onSelect(page._id, page.title)}
                                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                            >
                                {page.title}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
