"use client";

import { useRef, useEffect } from "react";
import type { ChatMessage } from "@/contexts/SocketContext";
import { TextMessage } from "./TextMessage";
import { DiceRollMessage } from "./DiceRollMessage";

type Props = {
    messages: ChatMessage[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
};

export function MessageList({ messages, currentUserId, onLoadMore, hasMore }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

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
            {messages.map((msg) =>
                msg.type === "text" ? (
                    <TextMessage key={msg._id} message={msg} isOwn={msg.userId === currentUserId} />
                ) : (
                    <DiceRollMessage key={msg._id} message={msg} isOwn={msg.userId === currentUserId} />
                )
            )}
            <div ref={bottomRef} />
        </div>
    );
}
