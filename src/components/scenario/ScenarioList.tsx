"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, BookText, Trash2 } from "lucide-react";

const API = "http://localhost:5050";

type Scenario = {
    _id: string;
    title: string;
    description: string;
    createdAt: string;
};

type Props = {
    gameId: string;
};

export function ScenarioList({ gameId }: Props) {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/scenarios`, { withCredentials: true })
            .then((res) => {
                if (res.data.success) setScenarios(res.data.scenarios);
            })
            .catch((err) => console.error("Erreur:", err))
            .finally(() => setLoading(false));
    }, [gameId]);

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
        if (!confirm("Supprimer ce scénario et toutes ses pages ?")) return;
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
        return <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">Scénarios</h1>
                <button
                    onClick={() => setCreating(!creating)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                    <Plus size={16} />
                    Nouveau scénario
                </button>
            </div>

            {creating && (
                <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg bg-background">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Titre du scénario..."
                        className="w-full px-3 py-2 text-sm border rounded bg-background mb-3"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setCreating(false)}
                            className="px-3 py-1.5 text-xs border rounded hover:bg-muted"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!newTitle.trim()}
                            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
                        >
                            Créer
                        </button>
                    </div>
                </form>
            )}

            {scenarios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <BookText size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun scénario pour cette partie</p>
                    <p className="text-xs mt-1">Créez-en un pour commencer à écrire votre histoire</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {scenarios.map((s) => (
                        <div
                            key={s._id}
                            className="group flex items-center gap-3 p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/game/${gameId}/scenario/${s._id}`)}
                        >
                            <BookText size={20} className="text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold truncate">{s.title}</h3>
                                {s.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                                </p>
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
                    ))}
                </div>
            )}
        </div>
    );
}
