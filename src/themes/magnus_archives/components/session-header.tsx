"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionHeaderProps } from "@/themes/types";

/** Toile de fils verts (couverture du livre de base) — décor de l'en-tête. */
function ThreadMotif() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 620 230"
            preserveAspectRatio="xMaxYMid slice"
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-[640px] max-w-[70%] opacity-60 sm:block"
            fill="none"
            stroke="var(--archives-thread)"
            strokeWidth="1"
        >
            <path d="M40 20 L210 92 L380 12 L522 120 L604 38" />
            <path d="M210 92 L300 204 L522 120 L470 226" />
            <path d="M140 184 L210 92 M140 184 L300 204 L470 226" />
            <path d="M380 12 L604 38 M40 20 L140 184 M210 92 L522 120 M380 12 L300 204" />
            <circle cx="210" cy="92" r="2.5" fill="var(--archives-thread)" />
            <circle cx="522" cy="120" r="2.5" fill="var(--archives-thread)" />
            <circle cx="300" cy="204" r="2.5" fill="var(--archives-thread)" />
        </svg>
    );
}

/** En-tête de dossier : système, titre de la partie, onglets de section, code d'invitation. */
export function ArchivesSessionHeader({ game, gameId, isMJ }: SessionHeaderProps) {
    const t = useTranslations("skins.magnus");
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
        <header className="relative shrink-0 overflow-hidden border-b bg-[color:var(--archives-desk-raised)]">
            <ThreadMotif />
            <div className="relative flex flex-col gap-3 px-4 pt-3 sm:px-6">
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-[color:var(--archives-signal)]">
                        {t("systemLabel")}
                        {isMJ && <span className="text-muted-foreground"> · {ts("gmBadge")}</span>}
                    </p>
                    <h1 className="archives-display text-3xl leading-tight text-accent-foreground sm:text-4xl">{game.name}</h1>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <nav aria-label={t("sectionsNav")} className="flex flex-wrap items-end gap-0.5">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                aria-current={tab.current ? "page" : undefined}
                                className={cn(
                                    "archives-tab archives-label text-[15px] transition-colors",
                                    tab.current
                                        ? "bg-background px-6 pb-2 pt-2.5 font-bold text-accent-foreground"
                                        : "bg-secondary px-5 pb-1.5 pt-2 font-semibold text-muted-foreground hover:text-foreground"
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
                                        className="inline-flex h-8 w-6 items-center justify-center border border-input text-base font-bold text-accent-foreground"
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
        </header>
    );
}
