"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/api";

export type ChatMessage = {
    _id: string;
    gameId: string;
    userId: string;
    username: string;
    type: "text" | "dice-roll";
    content?: string;
    diceRoll?: {
        diceType: string;
        quantity: number;
        results: number[];
        total: number;
    };
    createdAt: string;
};

export type DiceRollStartData = {
    messageId: string;
    gameId: string;
    userId: string;
    username: string;
    diceType: string;
    quantity: number;
    results: number[];
    total: number;
};

// ── Scène média (diffusion MJ → joueurs) ─────────────────────────────────

export type StageMediaKind = "audio" | "image" | "video" | "model3d";

export type StageMedia = {
    kind: StageMediaKind;
    url: string;
    title: string;
};

export type StageState = {
    gameId: string;
    media: StageMedia | null;
    playback: {
        playing: boolean;
        positionSec: number;
        updatedAtServerMs: number;
    };
};

export type StageControlAction = "play" | "pause" | "seek";

export type StageControl = {
    gameId: string;
    action: StageControlAction;
    positionSec: number;
    playing: boolean;
    serverTimeMs: number;
};

type SocketContextValue = {
    socket: Socket | null;
    connected: boolean;
    joinGame: (gameId: string) => void;
    leaveGame: (gameId: string) => void;
    sendMessage: (gameId: string, content: string) => void;
    rollDice: (gameId: string, diceType: string, quantity: number) => void;
    completeDiceRoll: (gameId: string, messageId: string) => void;
    setStage: (gameId: string, media: { kind: StageMediaKind; url: string; title: string }) => void;
    clearStage: (gameId: string) => void;
    controlStage: (gameId: string, action: StageControlAction, positionSec: number) => void;
    onChatMessage: (cb: (msg: ChatMessage) => void) => () => void;
    onDiceRollStart: (cb: (data: DiceRollStartData) => void) => () => void;
    onDiceRollResult: (cb: (msg: ChatMessage) => void) => () => void;
    onStageUpdate: (cb: (state: StageState) => void) => () => void;
    onStageControl: (cb: (control: StageControl) => void) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // SOCKET_URL vide => même origine (cas production derrière le reverse proxy)
        const socket = io(SOCKET_URL || undefined, {
            withCredentials: true,
            autoConnect: true,
        });

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const joinGame = useCallback((gameId: string) => {
        socketRef.current?.emit("join-game", gameId);
    }, []);

    const leaveGame = useCallback((gameId: string) => {
        socketRef.current?.emit("leave-game", gameId);
    }, []);

    const sendMessage = useCallback((gameId: string, content: string) => {
        socketRef.current?.emit("chat-message", { gameId, content });
    }, []);

    const rollDice = useCallback((gameId: string, diceType: string, quantity: number) => {
        socketRef.current?.emit("dice-roll", { gameId, diceType, quantity });
    }, []);

    const completeDiceRoll = useCallback((gameId: string, messageId: string) => {
        socketRef.current?.emit("dice-roll-complete", { gameId, messageId });
    }, []);

    const setStage = useCallback(
        (gameId: string, media: { kind: StageMediaKind; url: string; title: string }) => {
            socketRef.current?.emit("stage:set", { gameId, ...media });
        },
        []
    );

    const clearStage = useCallback((gameId: string) => {
        socketRef.current?.emit("stage:clear", { gameId });
    }, []);

    const controlStage = useCallback(
        (gameId: string, action: StageControlAction, positionSec: number) => {
            socketRef.current?.emit("stage:control", { gameId, action, positionSec });
        },
        []
    );

    const onChatMessage = useCallback((cb: (msg: ChatMessage) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on("chat-message", cb);
        return () => { socket.off("chat-message", cb); };
    }, []);

    const onDiceRollStart = useCallback((cb: (data: DiceRollStartData) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on("dice-roll-start", cb);
        return () => { socket.off("dice-roll-start", cb); };
    }, []);

    const onDiceRollResult = useCallback((cb: (msg: ChatMessage) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on("dice-roll-result", cb);
        return () => { socket.off("dice-roll-result", cb); };
    }, []);

    const onStageUpdate = useCallback((cb: (state: StageState) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on("stage:update", cb);
        return () => { socket.off("stage:update", cb); };
    }, []);

    const onStageControl = useCallback((cb: (control: StageControl) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on("stage:control", cb);
        return () => { socket.off("stage:control", cb); };
    }, []);

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            joinGame,
            leaveGame,
            sendMessage,
            rollDice,
            completeDiceRoll,
            setStage,
            clearStage,
            controlStage,
            onChatMessage,
            onDiceRollStart,
            onDiceRollResult,
            onStageUpdate,
            onStageControl,
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
    return ctx;
}
