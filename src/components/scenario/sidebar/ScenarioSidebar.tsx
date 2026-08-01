"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Tags } from "lucide-react";
import { useScenario } from "@/contexts/ScenarioContext";
import { PageListItem } from "./PageListItem";
import { SortableList } from "@/components/ui/sortable-list";
import { SortableItem } from "@/components/ui/sortable-item";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Props = {
    gameId: string;
    scenarioId: string;
};

export function ScenarioSidebar({ gameId, scenarioId }: Props) {
    const { pages, setPages, currentPageId, navigateToPage, addPage, removePage, scenario } = useScenario();
    const [search, setSearch] = useState("");
    const [groupByTag, setGroupByTag] = useState(false);

    const filtered = pages.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    const groups = useMemo(() => {
        if (!groupByTag) return null;
        const map = new Map<string, typeof filtered>();
        for (const page of filtered) {
            const tags = page.tags.length > 0 ? page.tags : ["Sans thème"];
            for (const tag of tags) {
                if (!map.has(tag)) map.set(tag, []);
                map.get(tag)!.push(page);
            }
        }
        return map;
    }, [filtered, groupByTag]);

    const handleCreatePage = async () => {
        try {
            const res = await axios.post(
                `${API}/games/${gameId}/scenarios/${scenarioId}/pages`,
                { title: "Nouvelle page" },
                { withCredentials: true }
            );
            if (res.data.success) {
                addPage({
                    _id: res.data.page._id,
                    title: res.data.page.title,
                    order: res.data.page.order,
                    tags: res.data.page.tags || [],
                });
                navigateToPage(res.data.page._id);
            }
        } catch (err) {
            console.error("Erreur création page:", err);
        }
    };

    const handleDeletePage = async (pageId: string) => {
        if (!confirm("Supprimer cette page ?")) return;
        try {
            await axios.delete(
                `${API}/games/${gameId}/scenarios/${scenarioId}/pages/${pageId}`,
                { withCredentials: true }
            );
            removePage(pageId);
        } catch (err) {
            console.error("Erreur suppression page:", err);
        }
    };

    const handleReorder = async (newIds: string[]) => {
        const reordered = newIds
            .map((id) => pages.find((p) => p._id === id))
            .filter((p): p is (typeof pages)[number] => Boolean(p))
            .map((p, index) => ({ ...p, order: index }));
        setPages(reordered);
        try {
            await axios.patch(
                `${API}/games/${gameId}/scenarios/${scenarioId}/pages/reorder`,
                { orders: reordered.map((p) => ({ pageId: p._id, order: p.order })) },
                { withCredentials: true }
            );
        } catch (err) {
            console.error("Erreur réordonnancement:", err);
        }
    };

    return (
        <div className="w-64 border-r bg-background flex flex-col shrink-0">
            <div className="p-3 border-b">
                <h2 className="text-sm font-bold truncate mb-2">{scenario?.title || "Scénario"}</h2>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border rounded bg-background"
                    />
                </div>
                <div className="flex items-center gap-1 mt-2">
                    <button
                        onClick={() => setGroupByTag(false)}
                        className={`flex-1 px-2 py-1 text-[11px] rounded ${!groupByTag ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                        Liste
                    </button>
                    <button
                        onClick={() => setGroupByTag(true)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[11px] rounded ${groupByTag ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                        <Tags size={11} />
                        Par thème
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {groupByTag && groups ? (
                    Array.from(groups.entries()).map(([tag, tagPages]) => (
                        <div key={tag} className="mb-3">
                            <h3 className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                                {tag}
                            </h3>
                            {tagPages.map((page) => (
                                <PageListItem
                                    key={page._id}
                                    title={page.title}
                                    tags={page.tags}
                                    isActive={page._id === currentPageId}
                                    isEntry={page._id === scenario?.entryPageId}
                                    onClick={() => navigateToPage(page._id)}
                                    onDelete={() => handleDeletePage(page._id)}
                                />
                            ))}
                        </div>
                    ))
                ) : search.trim() === "" ? (
                    <SortableList ids={filtered.map((p) => p._id)} onReorder={handleReorder}>
                        {filtered.map((page) => (
                            <SortableItem key={page._id} id={page._id}>
                                <PageListItem
                                    title={page.title}
                                    tags={page.tags}
                                    isActive={page._id === currentPageId}
                                    isEntry={page._id === scenario?.entryPageId}
                                    onClick={() => navigateToPage(page._id)}
                                    onDelete={() => handleDeletePage(page._id)}
                                />
                            </SortableItem>
                        ))}
                    </SortableList>
                ) : (
                    filtered.map((page) => (
                        <PageListItem
                            key={page._id}
                            title={page.title}
                            tags={page.tags}
                            isActive={page._id === currentPageId}
                            isEntry={page._id === scenario?.entryPageId}
                            onClick={() => navigateToPage(page._id)}
                            onDelete={() => handleDeletePage(page._id)}
                        />
                    ))
                )}
            </div>

            <div className="p-2 border-t">
                <button
                    onClick={handleCreatePage}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-dashed hover:bg-muted transition-colors"
                >
                    <Plus size={14} />
                    Ajouter une page
                </button>
            </div>
        </div>
    );
}
