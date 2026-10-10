"use client";

import { useRef, useEffect } from "react";
import type { ChatMessage } from "@/contexts/SocketContext";
import { TextMessage } from "./TextMessage";
import { DiceRollMessage } from "./DiceRollMessage";
import { TarotMessage } from "./TarotMessage";
import { useGameSkin } from "@/themes/game-skin-context";

type Props = {
    messages: ChatMessage[];
    currentUserId: string;
    gmUserId?: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
};

export function MessageList({ messages, currentUserId, gmUserId, onLoadMore, hasMore }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const skin = useGameSkin();
    const Text = skin.TextMessage ?? TextMessage;
    const Roll = skin.DiceRollMessage ?? DiceRollMessage;
    const Tarot = skin.TarotMessage ?? TarotMessage;

    // Auto-scroll on new messages
    useEffect(() => {
        if (messages.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevLengthRef.current = messages.length;
    }, [messages.length]);

    // Load more on scroll to top
    const handleScroll = () => {
        if (!containerRef.current || !hasMore || !onLoadMore) return;
        if (containerRef.current.scrollTop === 0) {
            onLoadMore();
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                Aucun message. Lancez les dés ou envoyez un message !
            </div>
        );
    }

    return (
        <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto min-h-0 px-3 py-2 flex flex-col gap-2">
            {hasMore && (
                <button onClick={onLoadMore} className="self-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                    Charger plus...
                </button>
            )}
            {messages.map((msg) => {
                const props = {
                    message: msg,
                    isOwn: msg.userId === currentUserId,
                    isGm: !!gmUserId && msg.userId === gmUserId,
                };
                if (msg.type === "text") return <Text key={msg._id} {...props} />;
                if (msg.type === "tarot") return <Tarot key={msg._id} {...props} />;
                return <Roll key={msg._id} {...props} />;
            })}
            <div ref={bottomRef} />
        </div>
    );
}
