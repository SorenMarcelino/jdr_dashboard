"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { TarotGrant, TarotState } from "@/config/tarot";

/**
 * Table de tarot de la partie : état diffusé par le serveur (déjà filtré pour
 * le membre courant) et actions. Le panneau redemande l'état à chaque montage
 * (fenêtre détachée, reconnexion).
 */
export function useTarot(gameId: string) {
    const { connected, requestTarot, grantTarot, drawTarot, resetTarot, onTarotState } = useSocket();
    const [state, setState] = useState<TarotState | null>(null);

    useEffect(() => {
        if (!connected) return;
        const off = onTarotState((next) => {
            if (next.gameId === gameId) setState(next);
        });
        requestTarot(gameId);
        return off;
    }, [connected, gameId, onTarotState, requestTarot]);

    const grant = useCallback((g: TarotGrant) => grantTarot(gameId, g), [gameId, grantTarot]);
    const draw = useCallback(() => drawTarot(gameId), [gameId, drawTarot]);
    const reset = useCallback(() => resetTarot(gameId), [gameId, resetTarot]);

    return { state, connected, grant, draw, reset };
}
