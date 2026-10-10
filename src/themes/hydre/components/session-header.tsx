"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionHeaderProps } from "@/themes/types";
import { DecorGear } from "./ornaments";

/** Engrenages de laiton entremêlés — décor de l'en-tête (couverture du livre). */
function GearCluster() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 hidden h-[190px] w-[300px] text-[color:var(--hydre-brass)] opacity-25 sm:block">
            <DecorGear className="absolute right-16 top-2 h-36 w-36" />
            <DecorGear className="absolute right-0 top-24 h-24 w-24" spokes={false} />
            <DecorGear className="absolute right-48 top-20 h-20 w-20" />
        </div>
    );
}

/** En-tête du club : système, titre de la partie, onglets-plaques, code d'invitation. */
export function HydreSessionHeader({ game, gameId, isMJ }: SessionHeaderProps) {
    const t = useTranslations("skins.hydre");
    const ts = useTranslations("game.session");
    const [copied, setCopied] = useState(false);

    const tabs = [
        { href: `/game/${gameId}`, label: t("boardTab"), current: true },
        ...(isMJ ? [{ href: `/game/${gameId}/scenario`, label: ts("scenariosLink"), current: false }] : []),
        { href: `/game/${gameId}/rules`, label: ts("rulesLink"), current: false },
        { href: `/game/${gameId}/lore`, label: ts("loreLink"), current: false },
    ];

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(game.inviteCode);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Presse-papiers indisponible (contexte non sécurisé) : le code reste lisible.
        }
    };

    return (
        <header className="relative shrink-0 overflow-hidden bg-[color:var(--hydre-wood-raised)]">
            <GearCluster />
            <div className="relative flex flex-col gap-3 px-4 pt-3 sm:px-6">
                <div className="flex flex-col gap-0.5">
                    <p className="hydre-display text-xs uppercase tracking-[0.12em] text-[color:var(--hydre-brass)]">
                        {t("systemLabel")}
                        {isMJ && <span className="text-muted-foreground"> · {ts("gmBadge")}</span>}
                    </p>
                    <h1 className="hydre-display text-3xl leading-tight text-accent-foreground sm:text-4xl">{game.name}</h1>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <nav aria-label={t("sectionsNav")} className="flex flex-wrap items-end gap-1">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                aria-current={tab.current ? "page" : undefined}
                                className={cn(
                                    "hydre-display rounded-t-sm border border-b-0 px-5 text-[15px] transition-colors",
                                    tab.current
                                        ? "border-[color:var(--hydre-brass)] bg-background pb-2 pt-2.5 text-[color:var(--hydre-brass-light)]"
                                        : "border-border bg-secondary pb-1.5 pt-2 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </nav>

                    {isMJ && (
                        <div className="flex items-center gap-2 pb-2">
                            <span className="text-xs text-muted-foreground">{t("inviteCode")}</span>
                            <span className="flex gap-[3px]" aria-label={game.inviteCode.split("").join(" ")}>
                                {game.inviteCode.split("").map((ch, i) => (
                                    <span
                                        key={i}
                                        aria-hidden="true"
                                        className="hydre-brass hydre-display inline-flex h-8 w-6 items-center justify-center rounded-sm text-base"
                                    >
                                        {ch}
                                    </span>
                                ))}
                            </span>
                            <button
                                type="button"
                                onClick={copyCode}
                                aria-label={copied ? t("codeCopied") : t("copyCode")}
                                title={copied ? t("codeCopied") : t("copyCode")}
                                className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div aria-hidden="true" className="hydre-rule" />
        </header>
    );
}
