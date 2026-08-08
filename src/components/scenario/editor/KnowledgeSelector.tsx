"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";

const API = API_URL;

type EntrySummary = {
    _id: string;
    title: string;
    category: string;
};

type Props = {
    gameId: string;
    entryType: "rule" | "lore";
    onSelect: (entryId: string, title: string) => void;
    onClose: () => void;
};

export function KnowledgeSelector({ gameId, entryType, onSelect, onClose }: Props) {
    const [entries, setEntries] = useState<EntrySummary[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const t = useTranslations("knowledge.selector");

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/knowledge-entries`, {
                params: { type: entryType },
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success) setEntries(res.data.entries || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [gameId, entryType]);

    const filtered = entries.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase())
    );

    const groups = new Map<string, EntrySummary[]>();
    for (const entry of filtered) {
        const category = entry.category || t("categoryFallback");
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category)!.push(entry);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background border rounded-lg shadow-lg w-80 max-h-96 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-3 border-b">
                    <h3 className="text-sm font-semibold mb-2">
                        {entryType === "rule" ? t("titleRule") : t("titleLore")}
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded bg-background"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    {loading ? (
                        <p className="text-xs text-muted-foreground text-center py-4">{t("loading")}</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">{t("empty")}</p>
                    ) : (
                        Array.from(groups.entries()).map(([category, categoryEntries]) => (
                            <div key={category}>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-2 pb-1">
                                    {category}
                                </p>
                                {categoryEntries.map((entry) => (
                                    <button
                                        key={entry._id}
                                        onClick={() => onSelect(entry._id, entry.title)}
                                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                                    >
                                        {entry.title}
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
