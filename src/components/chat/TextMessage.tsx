"use client";

import type { ChatMessage } from "@/contexts/SocketContext";

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function TextMessage({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
    return (
        <div className={`flex flex-col gap-0.5 max-w-[85%] ${isOwn ? "self-end items-end" : "self-start items-start"}`}>
            {!isOwn && (
                <span className="text-[10px] font-medium text-muted-foreground px-1">{message.username}</span>
            )}
            <div className={`rounded-lg px-3 py-1.5 text-sm break-words ${
                isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
            }`}>
                {message.content}
            </div>
            <span className="text-[10px] text-muted-foreground/60 px-1">{formatTime(message.createdAt)}</span>
        </div>
    );
}
