"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useSocket, type ChatMessage } from "@/contexts/SocketContext";
import { type DiceType } from "@/config/diceConfig";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { DiceBar } from "./DiceBar";
import { RecipientSelect } from "./RecipientSelect";
import { API_URL } from "@/lib/api";
import { useGameSkin } from "@/themes/game-skin-context";

const API = API_URL;

type Props = {
    gameId: string;
    currentUserId: string;
    /** userId du MJ : ses messages peuvent être rendus comme de la narration. */
    gmUserId?: string;
    /** Membres de la partie (MJ compris), destinataires possibles d'un message privé. */
    members: { _id: string; username: string }[];
};

export function ChatPanel({ gameId, currentUserId, gmUserId, members }: Props) {
    const {
        connected, joinGame, leaveGame, sendMessage, rollDice, deleteMessage,
        onChatMessage, onDiceRollResult, onMessageDeleted,
    } = useSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    // Destinataire des messages et jets : undefined = tout le monde.
    const [recipientId, setRecipientId] = useState<string>();
    const isMJ = !!gmUserId && gmUserId === currentUserId;
    const [hasMore, setHasMore] = useState(false);
    const loadingRef = useRef(false);
    const skin = useGameSkin();
    const SkinDiceBar = skin.DiceBar ?? DiceBar;
    const SkinChatInput = skin.ChatInput ?? ChatInput;
    const SkinRecipientSelect = skin.RecipientSelect ?? RecipientSelect;

    const recipients = members
        .filter((m) => m._id !== currentUserId)
        .map((m) => ({ ...m, isGm: m._id === gmUserId }));

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

        // Message supprimé par le MJ : retiré de tous les fils.
        const unsub3 = onMessageDeleted(({ gameId: id, messageId }) => {
            if (id === gameId) {
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
            }
        });

        return () => { unsub1(); unsub2(); unsub3(); };
    }, [gameId, onChatMessage, onDiceRollResult, onMessageDeleted]);

    const handleLoadMore = () => {
        if (messages.length > 0) {
            loadMessages(messages[0].createdAt);
        }
    };

    const handleSend = (content: string) => {
        sendMessage(gameId, content, recipientId);
    };

    const handleRoll = (diceType: DiceType, quantity: number) => {
        rollDice(gameId, diceType, quantity, recipientId);
    };

    const handleDelete = (messageId: string) => {
        deleteMessage(gameId, messageId);
    };

    return (
        <div className="h-full flex flex-col">
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                gmUserId={gmUserId}
                onDelete={isMJ ? handleDelete : undefined}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
            />
            {recipients.length > 0 && (
                <SkinRecipientSelect
                    members={recipients}
                    value={recipientId}
                    onChange={setRecipientId}
                    disabled={!connected}
                />
            )}
            <SkinDiceBar onRoll={handleRoll} disabled={!connected} />
            <SkinChatInput onSend={handleSend} disabled={!connected} />
        </div>
    );
}
