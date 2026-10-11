// src/components/knowledge/KnowledgeWorkspace.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslations } from "next-intl";
import { Navbar, type NavbarGame } from "@/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { KnowledgeProvider, useKnowledge } from "@/contexts/KnowledgeContext";
import { KnowledgeSidebar } from "./sidebar/KnowledgeSidebar";
import { KnowledgeEditor } from "./editor/KnowledgeEditor";
import { KnowledgeReader } from "./reader/KnowledgeReader";
import { getGameTheme } from "@/config/gameThemes";
import { useGameTheme } from "@/hooks/use-game-theme";
import { API_URL } from "@/lib/api";

const API = API_URL;

type Props = {
    gameId: string;
    type: "rule" | "lore";
};

function MJWorkspaceContent({ gameId, type }: Props) {
    const { setEntries, selectEntry } = useKnowledge();
    const [loading, setLoading] = useState(true);
    const t = useTranslations(`knowledge.${type}`);

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/knowledge-entries`, {
                params: { type },
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success) {
                    const list = res.data.entries || [];
                    setEntries(
                        list.map((e: { _id: string; title: string; category?: string; visibleToPlayers: boolean; order: number }) => ({
                            _id: e._id,
                            title: e.title,
                            category: e.category || "",
                            visibleToPlayers: e.visibleToPlayers,
                            order: e.order,
                        }))
                    );
                    if (list.length > 0) selectEntry(list[0]._id);
                }
            })
            .catch((err) => console.error("Erreur chargement entrées:", err))
            .finally(() => setLoading(false));
    }, [gameId, type, setEntries, selectEntry]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("loading")}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex min-h-0">
            <KnowledgeSidebar gameId={gameId} type={type} />
            <KnowledgeEditor gameId={gameId} />
        </div>
    );
}

export function KnowledgeWorkspace({ gameId, type }: Props) {
    const [isMJ, setIsMJ] = useState<boolean | null>(null);
    const [game, setGame] = useState<NavbarGame | null>(null);
    const t = useTranslations(`knowledge.${type}`);
    const tb = useTranslations("breadcrumb");

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/api/profile`, { withCredentials: true }),
            axios.get(`${API}/games/${gameId}`, { withCredentials: true }),
        ])
            .then(([userRes, gameRes]) => {
                if (userRes.data.success && gameRes.data.success) {
                    const userId = userRes.data.user._id;
                    const game = gameRes.data.game;
                    setGame(game);
                    setIsMJ(game.createdBy._id?.toString() === userId?.toString());
                }
            })
            .catch((err) => console.error("Erreur chargement:", err));
    }, [gameId]);

    // Thème visuel propre au système de jeu (posé sur <html> le temps de la consultation)
    useGameTheme(getGameTheme(game?.characterSheet));

    return (
        <div className="flex flex-col h-svh overflow-hidden bg-muted">
            <Navbar game={game ?? undefined} />
            <Breadcrumb
                items={[
                    { label: tb("myGames"), href: "/user" },
                    { label: game?.name, href: `/game/${gameId}` },
                    { label: tb(type === "rule" ? "rules" : "lore") },
                ]}
            />
            <div className="flex-1 flex min-h-0">
                {isMJ === null ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p className="text-sm">{t("loading")}</p>
                    </div>
                ) : isMJ ? (
                    <KnowledgeProvider>
                        <MJWorkspaceContent gameId={gameId} type={type} />
                    </KnowledgeProvider>
                ) : (
                    <KnowledgeReader gameId={gameId} type={type} />
                )}
            </div>
        </div>
    );
}
