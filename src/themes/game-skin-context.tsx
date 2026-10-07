"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GameSkin } from "./types";

export const DEFAULT_SKIN: GameSkin = { id: "default" };

const GameSkinContext = createContext<GameSkin>(DEFAULT_SKIN);

export function GameSkinProvider({ skin, children }: { skin: GameSkin; children: ReactNode }) {
    return <GameSkinContext.Provider value={skin}>{children}</GameSkinContext.Provider>;
}

/** Skin de l'univers de la partie en cours (skin par défaut hors partie). */
export function useGameSkin(): GameSkin {
    return useContext(GameSkinContext);
}
