"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { ChatMessage } from "@/contexts/SocketContext";

/** Tirage de tarot au chat, hors skin : une simple mention (les lames n'ont pas de rendu générique). */
export function TarotMessage({ message }: { message: ChatMessage; isOwn: boolean }) {
    const format = useFormatter();
    const t = useTranslations("chat");
    const tarot = message.tarot;
    if (!tarot) return null;

    return (
        <div className="flex flex-col gap-0.5 self-center items-center text-center">
            <span className="text-xs italic text-muted-foreground">
                {tarot.visible
                    ? t("tarotDrawn", { username: tarot.drawerName ?? message.username, count: tarot.count })
                    : t("tarotSecret", { username: tarot.drawerName ?? message.username })}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
                {format.dateTime(new Date(message.createdAt), { hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}
