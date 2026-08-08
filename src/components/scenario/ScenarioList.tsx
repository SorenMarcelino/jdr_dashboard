"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, BookText, Trash2, Search, FileStack } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { SortableList } from "@/components/ui/sortable-list";
import { SortableItem } from "@/components/ui/sortable-item";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Scenario = {
    _id: string;
    title: string;
    description: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    pageCount: number;
};

type SortMode = "manual" | "name" | "updatedAt";

type Props = {
    gameId: string;
};

export function ScenarioList({ gameId }: Props) {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [search, setSearch] = useState("");
    const [sortMode, setSortMode] = useState<SortMode>("manual");
    const t = useTranslations("scenario.list");
    const format = useFormatter();

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/scenarios`, { withCredentials: true })
            .then((res) => {
                if (res.data.success) setScenarios(res.data.scenarios);
            })
            .catch((err) => console.error("Erreur:", err))
            .finally(() => setLoading(false));
    }, [gameId]);

    const visible = useMemo(() => {
        const filtered = scenarios.filter(
            (s) =>
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.description?.toLowerCase().includes(search.toLowerCase())
        );
        if (sortMode === "name") {
            return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        }
        if (sortMode === "updatedAt") {
            return [...filtered].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        }
        return [...filtered].sort((a, b) => a.order - b.order);
    }, [scenarios, search, sortMode]);

    const handleReorder = async (newIds: string[]) => {
        const reordered = newIds
            .map((id) => scenarios.find((s) => s._id === id))
            .filter((s): s is Scenario => Boolean(s))
            .map((s, index) => ({ ...s, order: index }));
        setScenarios((prev) => {
            const others = prev.filter((s) => !newIds.includes(s._id));
            return [...reordered, ...others];
        });
        try {
            await axios.patch(
                `${API}/games/${gameId}/scenarios/reorder`,
                { orders: reordered.map((s) => ({ scenarioId: s._id, order: s.order })) },
                { withCredentials: true }
            );
        } catch (err) {
            console.error("Erreur réordonnancement:", err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        try {
            const res = await axios.post(
                `${API}/games/${gameId}/scenarios`,
                { title: newTitle.trim() },
                { withCredentials: true }
            );
            if (res.data.success) {
                router.push(`/game/${gameId}/scenario/${res.data.scenario._id}`);
            }
        } catch (err) {
            console.error("Erreur création:", err);
        }
    };

    const handleDelete = async (scenarioId: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await axios.delete(`${API}/games/${gameId}/scenarios/${scenarioId}`, {
                withCredentials: true,
            });
            setScenarios((prev) => prev.filter((s) => s._id !== scenarioId));
        } catch (err) {
            console.error("Erreur suppression:", err);
        }
    };

    if (loading) {
        return <p className="text-sm text-muted-foreground text-center py-8">{t("loading")}</p>;
    }

    const ScenarioCard = ({ s }: { s: Scenario }) => (
        <div
            className="group flex items-center gap-3 p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/game/${gameId}/scenario/${s._id}`)}
        >
            <BookText size={20} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{s.title}</h3>
                {s.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                        <FileStack size={11} />
                        {t("pageCount", { count: s.pageCount })}
                    </span>
                    <span>{t("modifiedOn", { date: format.dateTime(new Date(s.updatedAt), { dateStyle: "medium" }) })}</span>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-destructive transition-all"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">{t("heading")}</h1>
                <button
                    onClick={() => setCreating(!creating)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                    <Plus size={16} />
                    {t("newScenario")}
                </button>
            </div>

            {creating && (
                <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg bg-background">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={t("titlePlaceholder")}
                        className="w-full px-3 py-2 text-sm border rounded bg-background mb-3"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setCreating(false)}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={!newTitle.trim()}
                            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
                        >
                            {t("create")}
                        </button>
                    </div>
                </form>
            )}

            {scenarios.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                        <input
                            type="text"
                            placeholder={t("search")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-xs border rounded bg-background"
                        />
                    </div>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="text-xs border rounded px-2 py-1.5 bg-background"
                    >
                        <option value="manual">{t("sortManual")}</option>
                        <option value="name">{t("sortName")}</option>
                        <option value="updatedAt">{t("sortUpdated")}</option>
                    </select>
                </div>
            )}

            {scenarios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <BookText size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t("empty")}</p>
                    <p className="text-xs mt-1">{t("emptyHint")}</p>
                </div>
            ) : sortMode === "manual" && !search.trim() ? (
                <SortableList ids={visible.map((s) => s._id)} onReorder={handleReorder}>
                    <div className="space-y-2">
                        {visible.map((s) => (
                            <SortableItem key={s._id} id={s._id}>
                                <ScenarioCard s={s} />
                            </SortableItem>
                        ))}
                    </div>
                </SortableList>
            ) : (
                <div className="space-y-2">
                    {visible.map((s) => (
                        <ScenarioCard key={s._id} s={s} />
                    ))}
                </div>
            )}
        </div>
    );
}
