"use client";

import { useState, type ReactNode } from "react";
import { Check, Lock, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChatMessage } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";

type Props = {
    message: ChatMessage;
    isOwn: boolean;
    /** Le skin par défaut aligne ses propres messages à droite ; les skins d'univers utilisent des lignes pleine largeur. */
    ownOnRight: boolean;
    /** Présent si le spectateur (MJ) peut supprimer le message. */
    onDelete?: () => void;
    children: ReactNode;
};

/**
 * Habillage commun à tous les messages, quel que soit le skin : mention
 * « privé » et action de suppression (MJ), avec confirmation en place.
 */
export function MessageFrame({ message, isOwn, ownOnRight, onDelete, children }: Props) {
    const t = useTranslations("chat");
    const [confirming, setConfirming] = useState(false);
    const isPrivate = !!message.recipientId;
    const alignRight = isOwn && ownOnRight;

    return (
        <div className={cn("group relative flex flex-col", isPrivate && "border-l-2 border-dashed border-primary/60 pl-2")}>
            {isPrivate && (
                <span className={cn("flex items-center gap-1 px-1 text-[10px] font-medium text-primary", alignRight ? "self-end" : "self-start")}>
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    {isOwn ? t("privateTo", { username: message.recipientUsername ?? "" }) : t("privateForYou")}
                </span>
            )}
            {children}
            {onDelete && (
                <div
                    className={cn(
                        "absolute top-0 flex items-center gap-1 rounded-md border bg-background/95 p-0.5 text-xs shadow-sm transition-opacity",
                        alignRight ? "left-0" : "right-0",
                        confirming
                            ? "opacity-100"
                            : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    )}
                >
                    {confirming ? (
                        <>
                            <span className="px-1 text-foreground">{t("confirmDelete")}</span>
                            <button
                                type="button"
                                onClick={onDelete}
                                aria-label={t("confirm")}
                                title={t("confirm")}
                                className="rounded p-1 text-destructive hover:bg-destructive/10"
                            >
                                <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                aria-label={t("cancel")}
                                title={t("cancel")}
                                className="rounded p-1 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            aria-label={t("delete")}
                            title={t("delete")}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
