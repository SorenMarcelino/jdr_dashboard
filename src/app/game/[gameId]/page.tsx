"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/navbar";
import { CharacterSheetViewer } from "@/components/character-sheet/CharacterSheetViewer";
import { BentoGrid } from "@/components/bento/BentoGrid";

const API = "http://localhost:5050";

type User = {
    _id: string;
    username: string;
    email: string;
};

type Game = {
    _id: string;
    name: string;
    characterSheet: string;
    createdBy: { _id: string; username: string };
    players: User[];
    inviteCode: string;
};

const SYSTEM_ID_MAP: Record<string, string> = {
    "Magnus Archives": "magnus_archives",
    "magnus_archives": "magnus_archives",
};

function resolveSystemId(characterSheet: string): string {
    return SYSTEM_ID_MAP[characterSheet] ?? characterSheet.toLowerCase().replace(/\s+/g, "_");
}

function PlaceholderContent({ label }: { label: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-2xl">✦</span>
            <p className="text-xs">{label}</p>
            <p className="text-xs opacity-50">Bientôt disponible</p>
        </div>
    );
}

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    const router = useRouter();
    const [game, setGame] = useState<Game | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [userRes, gamesRes] = await Promise.all([
                    axios.get(`${API}/api/profile`, { withCredentials: true }),
                    axios.get(`${API}/games/`, { withCredentials: true }),
                ]);

                if (userRes.data.success) setCurrentUser(userRes.data.user);

                if (gamesRes.data.success) {
                    const found = gamesRes.data.games.find((g: Game) => g._id === gameId);
                    setGame(found ?? null);
                    if (found?.players?.length > 0) setSelectedPlayer(found.players[0]);
                }
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push("/login");
                } else {
                    console.error("Erreur chargement partie:", err);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [gameId]);

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-svh bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">Chargement...</p>
                </main>
            </>
        );
    }

    if (!game || !currentUser) {
        return (
            <>
                <Navbar />
                <main className="min-h-svh bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">Partie introuvable ou accès refusé.</p>
                </main>
            </>
        );
    }

    const isMJ = game.createdBy._id?.toString() === currentUser._id?.toString();
    const systemId = resolveSystemId(game.characterSheet);

    // Contenu du panneau fiche selon le rôle
    const sheetContent = isMJ ? (
        game.players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                <span className="text-3xl">👥</span>
                <p className="text-sm font-medium">Aucun joueur n&apos;a rejoint cette partie.</p>
                <p className="text-xs">Code : <span className="font-mono font-bold">{game.inviteCode}</span></p>
            </div>
        ) : selectedPlayer ? (
            <CharacterSheetViewer
                systemId={systemId}
                gameId={gameId}
                playerId={selectedPlayer._id}
                isEditable={true}
            />
        ) : null
    ) : (
        <CharacterSheetViewer
            systemId={systemId}
            gameId={gameId}
            isEditable={true}
        />
    );

    // Header du panneau fiche (MJ : sélecteur de joueur)
    const sheetHeaderRight = isMJ && game.players.length > 0 ? (
        <div className="flex gap-1">
            {game.players.map((player) => (
                <button
                    key={player._id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                        ${selectedPlayer?._id === player._id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-muted-foreground/30 hover:border-primary"
                        }`}
                >
                    {player.username}
                </button>
            ))}
        </div>
    ) : undefined;

    const bentoItems = [
        {
            id: "sheet",
            title: isMJ
                ? `Fiche — ${selectedPlayer?.username ?? "Sélectionner un joueur"}`
                : "Fiche de personnage",
            defaultLayout: { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 4 },
            content: sheetContent,
            headerRight: sheetHeaderRight,
        },
        {
            id: "notes",
            title: "Notes de session",
            defaultLayout: { x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 2 },
            content: <PlaceholderContent label="Notes de session" />,
        },
        {
            id: "chat",
            title: "Chat / Dés",
            defaultLayout: { x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 2 },
            content: <PlaceholderContent label="Chat & lancers de dés" />,
        },
    ];

    return (
        <div className="flex flex-col h-svh overflow-hidden bg-muted">
            <Navbar />

            {/* Barre de contexte */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-background">
                <div className="flex items-center gap-3">
                    <h1 className="text-sm font-bold">{game.name}</h1>
                    {isMJ && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">MJ</span>
                    )}
                    <span className="text-xs text-muted-foreground">{game.characterSheet}</span>
                </div>
                {isMJ && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Code :</span>
                        <span className="font-mono font-bold tracking-widest bg-muted px-2 py-0.5 rounded">{game.inviteCode}</span>
                    </div>
                )}
            </div>

            {/* Bento dashboard */}
            <div className="flex-1 overflow-hidden p-3">
                <BentoGrid
                    items={bentoItems}
                    storageKey={`bento-layout-${gameId}-${isMJ ? "mj" : "player"}`}
                />
            </div>
        </div>
    );
}
