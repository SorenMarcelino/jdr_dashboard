// src/components/knowledge/KnowledgeWorkspace.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { KnowledgeProvider, useKnowledge } from "@/contexts/KnowledgeContext";
import { KnowledgeSidebar } from "./sidebar/KnowledgeSidebar";
import { KnowledgeEditor } from "./editor/KnowledgeEditor";
import { KnowledgeReader } from "./reader/KnowledgeReader";
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
    const t = useTranslations(`knowledge.${type}`);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/api/profile`, { withCredentials: true }),
            axios.get(`${API}/games/${gameId}`, { withCredentials: true }),
        ])
            .then(([userRes, gameRes]) => {
                if (userRes.data.success && gameRes.data.success) {
                    const userId = userRes.data.user.id;
                    const game = gameRes.data.game;
                    setIsMJ(game.createdBy._id?.toString() === userId?.toString());
                }
            })
            .catch((err) => console.error("Erreur chargement:", err));
    }, [gameId]);

    if (isMJ === null) {
        return (
            <div className="flex flex-col h-svh items-center justify-center text-muted-foreground bg-muted">
                <p className="text-sm">{t("loading")}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-svh overflow-hidden bg-muted">
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-background">
                <Link href={`/game/${gameId}`} className="p-1.5 rounded hover:bg-muted transition-colors">
                    <ArrowLeft size={16} />
                </Link>
                <h1 className="text-sm font-bold">{t("heading")}</h1>
            </div>
            <div className="flex-1 flex min-h-0">
                {isMJ ? (
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
