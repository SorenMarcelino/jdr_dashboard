"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { useKnowledge } from "@/contexts/KnowledgeContext";
import { KnowledgeEntryListItem } from "./KnowledgeEntryListItem";
import { SortableList } from "@/components/ui/sortable-list";
import { SortableItem } from "@/components/ui/sortable-item";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Props = {
    gameId: string;
    type: "rule" | "lore";
};

export function KnowledgeSidebar({ gameId, type }: Props) {
    const { entries, setEntries, currentEntryId, selectEntry, addEntry, removeEntry } = useKnowledge();
    const [search, setSearch] = useState("");
    const [groupByCategory, setGroupByCategory] = useState(false);
    const t = useTranslations("knowledge.sidebar");
    const tType = useTranslations(`knowledge.${type}`);

    const filtered = entries.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase())
    );

    const groups = useMemo(() => {
        if (!groupByCategory) return null;
        const map = new Map<string, typeof filtered>();
        for (const entry of filtered) {
            const category = entry.category || t("noCategory");
            if (!map.has(category)) map.set(category, []);
            map.get(category)!.push(entry);
        }
        return map;
    }, [filtered, groupByCategory, t]);

    const handleCreateEntry = async () => {
        try {
            const res = await axios.post(
                `${API}/games/${gameId}/knowledge-entries`,
                { type, title: tType("newEntryTitle") },
                { withCredentials: true }
            );
            if (res.data.success) {
                addEntry({
                    _id: res.data.entry._id,
                    title: res.data.entry.title,
                    category: res.data.entry.category || "",
                    visibleToPlayers: res.data.entry.visibleToPlayers,
                    order: res.data.entry.order,
                });
                selectEntry(res.data.entry._id);
            }
        } catch (err) {
            console.error("Erreur création entrée:", err);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await axios.delete(`${API}/games/${gameId}/knowledge-entries/${entryId}`, {
                withCredentials: true,
            });
            removeEntry(entryId);
        } catch (err) {
            console.error("Erreur suppression entrée:", err);
        }
    };

    const handleReorder = async (newIds: string[]) => {
        const reordered = newIds
            .map((id) => entries.find((e) => e._id === id))
            .filter((e): e is (typeof entries)[number] => Boolean(e))
            .map((e, index) => ({ ...e, order: index }));
        setEntries(reordered);
        try {
            await axios.patch(
                `${API}/games/${gameId}/knowledge-entries/reorder`,
                { type, orders: reordered.map((e) => ({ entryId: e._id, order: e.order })) },
                { withCredentials: true }
            );
        } catch (err) {
            console.error("Erreur réordonnancement:", err);
        }
    };

    return (
        <div className="w-64 border-r bg-background flex flex-col shrink-0">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    <input
                        type="text"
                        placeholder={t("search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border rounded bg-background"
                    />
                </div>
                <div className="flex items-center gap-1 mt-2">
                    <button
                        onClick={() => setGroupByCategory(false)}
                        className={`flex-1 px-2 py-1 text-[11px] rounded ${!groupByCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                        {t("viewList")}
                    </button>
                    <button
                        onClick={() => setGroupByCategory(true)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[11px] rounded ${groupByCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                        <Tags size={11} />
                        {t("viewByCategory")}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {groupByCategory && groups ? (
                    Array.from(groups.entries()).map(([category, categoryEntries]) => (
                        <div key={category} className="mb-3">
                            <h3 className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                                {category}
                            </h3>
                            {categoryEntries.map((entry) => (
                                <KnowledgeEntryListItem
                                    key={entry._id}
                                    title={entry.title}
                                    visibleToPlayers={entry.visibleToPlayers}
                                    isActive={entry._id === currentEntryId}
                                    onClick={() => selectEntry(entry._id)}
                                    onDelete={() => handleDeleteEntry(entry._id)}
                                />
                            ))}
                        </div>
                    ))
                ) : search.trim() === "" ? (
                    <SortableList ids={filtered.map((e) => e._id)} onReorder={handleReorder}>
                        {filtered.map((entry) => (
                            <SortableItem key={entry._id} id={entry._id}>
                                <KnowledgeEntryListItem
                                    title={entry.title}
                                    visibleToPlayers={entry.visibleToPlayers}
                                    isActive={entry._id === currentEntryId}
                                    onClick={() => selectEntry(entry._id)}
                                    onDelete={() => handleDeleteEntry(entry._id)}
                                />
                            </SortableItem>
                        ))}
                    </SortableList>
                ) : (
                    filtered.map((entry) => (
                        <KnowledgeEntryListItem
                            key={entry._id}
                            title={entry.title}
                            visibleToPlayers={entry.visibleToPlayers}
                            isActive={entry._id === currentEntryId}
                            onClick={() => selectEntry(entry._id)}
                            onDelete={() => handleDeleteEntry(entry._id)}
                        />
                    ))
                )}
            </div>

            <div className="p-2 border-t">
                <button
                    onClick={handleCreateEntry}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-dashed hover:bg-muted transition-colors"
                >
                    <Plus size={14} />
                    {tType("addEntry")}
                </button>
            </div>
        </div>
    );
}
