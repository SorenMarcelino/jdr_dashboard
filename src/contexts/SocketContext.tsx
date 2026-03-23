"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5050";

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
    gameId: string;
    userId: string;
    username: string;
    diceType: string;
    quantity: number;
    results: number[];
    total: number;
};

type SocketContextValue = {
    socket: Socket | null;
    connected: boolean;
    joinGame: (gameId: string) => void;
    leaveGame: (gameId: string) => void;
    sendMessage: (gameId: string, content: string) => void;
    rollDice: (gameId: string, diceType: string, quantity: number) => void;
    completeDiceRoll: (gameId: string, diceType: string, quantity: number, results: number[], total: number) => void;
    onChatMessage: (cb: (msg: ChatMessage) => void) => () => void;
    onDiceRollStart: (cb: (data: DiceRollStartData) => void) => () => void;
    onDiceRollResult: (cb: (msg: ChatMessage) => void) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
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

    const completeDiceRoll = useCallback((gameId: string, diceType: string, quantity: number, results: number[], total: number) => {
        socketRef.current?.emit("dice-roll-complete", { gameId, diceType, quantity, results, total });
    }, []);

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

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            joinGame,
            leaveGame,
            sendMessage,
            rollDice,
            completeDiceRoll,
            onChatMessage,
            onDiceRollStart,
            onDiceRollResult,
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
