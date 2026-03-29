"use client";

import { useState } from "react";
import axios from "axios";
import { Plus, Search } from "lucide-react";
import { useScenario } from "@/contexts/ScenarioContext";
import { PageListItem } from "./PageListItem";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    scenarioId: string;
};

export function ScenarioSidebar({ gameId, scenarioId }: Props) {
    const { pages, currentPageId, navigateToPage, addPage, removePage, scenario } = useScenario();
    const [search, setSearch] = useState("");

    const filtered = pages.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

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
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filtered.map((page) => (
                    <PageListItem
                        key={page._id}
                        title={page.title}
                        isActive={page._id === currentPageId}
                        isEntry={page._id === scenario?.entryPageId}
                        onClick={() => navigateToPage(page._id)}
                        onDelete={() => handleDeletePage(page._id)}
                    />
                ))}
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
