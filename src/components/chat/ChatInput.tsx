"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type Props = {
    onSend: (content: string) => void;
    disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: Props) {
    const [value, setValue] = useState("");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setValue("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 px-2 py-1.5 border-t bg-background">
            <input
                type="text"
                placeholder="Message..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={disabled}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 px-2 py-1"
            />
            <button
                type="submit"
                disabled={disabled || !value.trim()}
                className="shrink-0 p-1.5 rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
    );
}
