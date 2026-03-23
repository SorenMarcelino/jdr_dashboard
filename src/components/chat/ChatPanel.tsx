"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useSocket, type ChatMessage } from "@/contexts/SocketContext";
import { type DiceType } from "@/config/diceConfig";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { DiceBar } from "./DiceBar";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    currentUserId: string;
};

export function ChatPanel({ gameId, currentUserId }: Props) {
    const { connected, joinGame, leaveGame, sendMessage, rollDice, onChatMessage, onDiceRollResult } = useSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const loadingRef = useRef(false);

    // Load message history
    const loadMessages = useCallback(async (before?: string) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (before) params.set("before", before);
            const res = await axios.get(`${API}/games/${gameId}/messages?${params}`, { withCredentials: true });
            if (res.data.success) {
                const fetched: ChatMessage[] = res.data.messages;
                if (before) {
                    setMessages((prev) => [...fetched, ...prev]);
                } else {
                    setMessages(fetched);
                }
                setHasMore(fetched.length >= 50);
            }
        } catch (err) {
            console.error("Error loading messages:", err);
        } finally {
            loadingRef.current = false;
        }
    }, [gameId]);

    // Join game room + load history
    useEffect(() => {
        if (!connected) return;
        joinGame(gameId);
        loadMessages();
        return () => leaveGame(gameId);
    }, [connected, gameId, joinGame, leaveGame, loadMessages]);

    // Listen for real-time events
    useEffect(() => {
        // Text messages: show immediately
        const unsub1 = onChatMessage((msg) => {
            if (msg.gameId === gameId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        // Dice roll results: arrives after the roller's physics animation completes
        const unsub2 = onDiceRollResult((msg) => {
            if (msg.gameId === gameId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        return () => { unsub1(); unsub2(); };
    }, [gameId, onChatMessage, onDiceRollResult]);

    const handleLoadMore = () => {
        if (messages.length > 0) {
            loadMessages(messages[0].createdAt);
        }
    };

    const handleSend = (content: string) => {
        sendMessage(gameId, content);
    };

    const handleRoll = (diceType: DiceType, quantity: number) => {
        rollDice(gameId, diceType, quantity);
    };

    return (
        <div className="h-full flex flex-col">
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
            />
            <DiceBar onRoll={handleRoll} disabled={!connected} />
            <ChatInput onSend={handleSend} disabled={!connected} />
        </div>
    );
}
