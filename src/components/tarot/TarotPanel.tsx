"use client";

import { useTarot } from "@/hooks/use-tarot";
import { useGameSkin } from "@/themes/game-skin-context";

type Props = {
    gameId: string;
    isMJ: boolean;
    currentUserId: string;
    players: { _id: string; username: string }[];
};

/** Widget de tarot : branche la table du serveur sur le composant du skin. */
export function TarotPanel({ gameId, isMJ, currentUserId, players }: Props) {
    const Table = useGameSkin().TarotTable;
    const { state, connected, grant, draw, reset } = useTarot(gameId);

    if (!Table) return null;

    return (
        <Table
            state={state}
            connected={connected}
            isMJ={isMJ}
            currentUserId={currentUserId}
            players={players}
            onGrant={grant}
            onDraw={draw}
            onReset={reset}
        />
    );
}
