"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, PenLine, GitBranch, PanelLeftClose, PanelLeft, Users } from "lucide-react";
import { ScenarioProvider, useScenario } from "@/contexts/ScenarioContext";
import { ScenarioSidebar } from "./sidebar/ScenarioSidebar";
import { ScenarioEditor } from "./editor/ScenarioEditor";
import { ScenarioReader } from "./reader/ScenarioReader";
import { ScenarioGraph } from "./graph/ScenarioGraph";
import { NpcManager } from "./editor/npc-manager";
import { resolveSystemId } from "@/lib/system-id";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    scenarioId: string;
};

function WorkspaceContent({ gameId, scenarioId }: Props) {
    const { scenario, setScenario, setPages, navigateToPage, mode, setMode } = useScenario();
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showGraph, setShowGraph] = useState(false);
    const [npcManagerOpen, setNpcManagerOpen] = useState(false);
    const [systemId, setSystemId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/games/${gameId}/scenarios/${scenarioId}`, { withCredentials: true }),
            axios.get(`${API}/games/`, { withCredentials: true }),
        ])
            .then(([scenarioRes, gamesRes]) => {
                if (scenarioRes.data.success) {
                    setScenario({
                        _id: scenarioRes.data.scenario._id,
                        title: scenarioRes.data.scenario.title,
                        description: scenarioRes.data.scenario.description,
                        entryPageId: scenarioRes.data.scenario.entryPageId,
                        currentPageId: scenarioRes.data.scenario.currentPageId,
                        gameId,
                    });
                    setPages(
                        scenarioRes.data.pages.map((p: { _id: string; title: string; order: number; tags?: string[] }) => ({
                            _id: p._id,
                            title: p.title,
                            order: p.order,
                            tags: p.tags || [],
                        }))
                    );
                    const entryId = scenarioRes.data.scenario.entryPageId || scenarioRes.data.pages?.[0]?._id;
                    if (entryId) navigateToPage(entryId);
                }
                if (gamesRes.data.success) {
                    const game = gamesRes.data.games?.find((g: { _id: string; characterSheet: string }) => g._id === gameId);
                    if (game) setSystemId(resolveSystemId(game.characterSheet));
                }
            })
            .catch((err) => console.error("Erreur chargement scénario:", err))
            .finally(() => setLoading(false));
    }, [gameId, scenarioId, setScenario, setPages, navigateToPage]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Chargement du scénario...</p>
            </div>
        );
    }

    if (!scenario) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Scénario introuvable</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Top bar */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-background">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title={showSidebar ? "Masquer la sidebar" : "Afficher la sidebar"}
                    >
                        {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                    </button>
                    <h1 className="text-sm font-bold">{scenario.title}</h1>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMode("edit")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                            mode === "edit" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                        <PenLine size={13} />
                        Édition
                    </button>
                    <button
                        onClick={() => setMode("read")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                            mode === "read" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                        <BookOpen size={13} />
                        Lecture
                    </button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <button
                        onClick={() => setShowGraph(!showGraph)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                            showGraph ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                        <GitBranch size={13} />
                        Carte
                    </button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <button
                        onClick={() => setNpcManagerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md hover:bg-muted transition-colors"
                    >
                        <Users size={13} />
                        PNJ
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex min-h-0">
                {showSidebar && (
                    <ScenarioSidebar gameId={gameId} scenarioId={scenarioId} />
                )}

                {showGraph ? (
                    <div className="flex-1 flex min-h-0">
                        <div className="flex-1 min-h-0">
                            <ScenarioGraph gameId={gameId} scenarioId={scenarioId} />
                        </div>
                    </div>
                ) : mode === "edit" ? (
                    <ScenarioEditor gameId={gameId} scenarioId={scenarioId} />
                ) : (
                    <ScenarioReader gameId={gameId} scenarioId={scenarioId} />
                )}
            </div>

            <NpcManager
                gameId={gameId}
                systemId={systemId}
                open={npcManagerOpen}
                onOpenChange={setNpcManagerOpen}
            />
        </div>
    );
}

export function ScenarioWorkspace({ gameId, scenarioId }: Props) {
    return (
        <ScenarioProvider>
            <WorkspaceContent gameId={gameId} scenarioId={scenarioId} />
        </ScenarioProvider>
    );
}
