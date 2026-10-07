"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { CharacterSheetViewer } from "@/components/character-sheet/CharacterSheetViewer";
import { BentoGrid } from "@/components/bento/BentoGrid";
import { SocketProvider } from "@/contexts/SocketContext";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { StagePanel } from "@/components/stage/StagePanel";
import { resolveSystemId } from "@/lib/system-id";
import { getGameTheme } from "@/config/gameThemes";
import { useGameTheme } from "@/hooks/use-game-theme";
import { SessionHeader } from "@/components/game/session-header";
import { PlayerSelector } from "@/components/game/player-selector";
import { GameSkinProvider } from "@/themes/game-skin-context";
import { getGameSkin } from "@/themes/registry";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";

const DiceScene = dynamic(() => import("@/components/dice/DiceScene").then((m) => m.DiceScene), { ssr: false });

const API = API_URL;

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

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    const router = useRouter();
    const [game, setGame] = useState<Game | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("game.session");

    useEffect(() => {
        const load = async () => {
            try {
                const [userRes, gameRes] = await Promise.all([
                    axios.get(`${API}/api/profile`, { withCredentials: true }),
                    axios.get(`${API}/games/${gameId}`, { withCredentials: true }),
                ]);

                if (userRes.data.success) setCurrentUser(userRes.data.user);

                if (gameRes.data.success) {
                    const found: Game = gameRes.data.game;
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
    }, [gameId, router]);

    // Thème visuel propre au système de jeu (posé sur <html> le temps de la partie)
    useGameTheme(getGameTheme(game?.characterSheet));
    // Composants propres à l'univers (en-tête, cadres, fiche, chat…)
    const skin = getGameSkin(game?.characterSheet);
    const SkinSessionHeader = skin.SessionHeader ?? SessionHeader;
    const SkinPlayerSelector = skin.PlayerSelector ?? PlayerSelector;

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-svh bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">{t("loading")}</p>
                </main>
            </>
        );
    }

    if (!game || !currentUser) {
        return (
            <>
                <Navbar />
                <main className="min-h-svh bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">{t("notFound")}</p>
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
                <p className="text-sm font-medium">{t("noPlayers")}</p>
                <p className="text-xs">{t("codeLabel")} <span className="font-mono font-bold">{game.inviteCode}</span></p>
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
        <SkinPlayerSelector
            players={game.players}
            selectedId={selectedPlayer?._id}
            onSelect={(id) => setSelectedPlayer(game.players.find((p) => p._id === id) ?? null)}
        />
    ) : undefined;

    const bentoItems = [
        {
            id: "sheet",
            title: isMJ
                ? t("sheetTitleFor", { username: selectedPlayer?.username ?? t("selectPlayer") })
                : t("sheetTitleDefault"),
            defaultLayout: { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 4 },
            content: sheetContent,
            headerRight: sheetHeaderRight,
        },
        {
            id: "stage",
            title: t("stageTitle"),
            defaultLayout: { x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 3 },
            content: <StagePanel gameId={gameId} isMJ={isMJ} />,
        },
        {
            id: "chat",
            title: t("chatTitle"),
            defaultLayout: { x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 2 },
            content: <ChatPanel gameId={gameId} currentUserId={currentUser._id} gmUserId={game.createdBy._id} />,
        },
    ];

    return (
        <SocketProvider>
            <GameSkinProvider skin={skin}>
                <div className={cn("flex flex-col h-svh overflow-hidden bg-muted", skin.pageClassName)}>
                    <Navbar game={game} />

                    {/* Barre de contexte */}
                    <SkinSessionHeader game={game} gameId={gameId} isMJ={isMJ} />

                    {/* Bento dashboard */}
                    <div className="flex-1 overflow-hidden p-3">
                        <BentoGrid
                            items={bentoItems}
                            storageKey={`bento-layout-${gameId}-${isMJ ? "mj" : "player"}`}
                        />
                    </div>

                    {/* 3D Dice overlay */}
                    <DiceScene gameId={gameId} currentUserId={currentUser._id} />
                </div>
            </GameSkinProvider>
        </SocketProvider>
    );
}
