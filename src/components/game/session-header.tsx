"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SessionHeaderProps } from "@/themes/types";

/** Barre de contexte de la partie (skin par défaut). */
export function SessionHeader({ game, gameId, isMJ }: SessionHeaderProps) {
    const t = useTranslations("game.session");

    return (
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-background">
            <div className="flex items-center gap-3">
                <h1 className="text-sm font-bold">{game.name}</h1>
                {isMJ && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">{t("gmBadge")}</span>
                )}
                <span className="text-xs text-muted-foreground">{game.characterSheet}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Link
                    href={`/game/${gameId}/rules`}
                    className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-foreground font-medium transition-colors"
                >
                    {t("rulesLink")}
                </Link>
                <Link
                    href={`/game/${gameId}/lore`}
                    className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-foreground font-medium transition-colors"
                >
                    {t("loreLink")}
                </Link>
                {isMJ && (
                    <>
                        <Link
                            href={`/game/${gameId}/scenario`}
                            className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-foreground font-medium transition-colors"
                        >
                            {t("scenariosLink")}
                        </Link>
                        <div className="flex items-center gap-2">
                            <span>{t("codeLabel")}</span>
                            <span className="font-mono font-bold tracking-widest bg-muted px-2 py-0.5 rounded">{game.inviteCode}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
