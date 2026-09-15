"use client";

import { useTranslations } from "next-intl";
import type { Badge, ChatPlayerStats } from "@/types/stats";

const BADGE_EMOJI: Record<string, string> = {
    blessed: "🎲",
    cursed: "💀",
    critic: "🎯",
    chatterbox: "🗣️",
    novelist: "📜",
    slowpoke: "🐢",
    highRoller: "🎰",
    nightOwl: "🌙",
};

// Doit rester aligné sur BADGE_THRESHOLDS.nightOwl côté backend, qui documente
// ce même seuil sans l'appliquer : le badge est calculé ici, pas côté serveur.
export const NIGHT_OWL_MIN_MESSAGES = 20;

// Le Noctambule se calcule ici et non côté serveur : « tard le soir » dépend du
// fuseau du lecteur, que le backend ne connaît pas. On mesure la part des
// messages tombant entre 22 h et 4 h locales, à partir de l'histogramme horaire
// UTC de chaque joueur.
function nightOwlBadge(players: ChatPlayerStats[]): Badge | null {
    const offsetHours = -Math.round(new Date().getTimezoneOffset() / 60);
    const isNight = (localHour: number) => localHour >= 22 || localHour < 4;

    let best: Badge | null = null;
    let bestShare = 0;

    for (const p of players) {
        if (p.messages < NIGHT_OWL_MIN_MESSAGES) continue;

        let nightCount = 0;
        for (let utcHour = 0; utcHour < 24; utcHour++) {
            const localHour = ((utcHour + offsetHours) % 24 + 24) % 24;
            if (isNight(localHour)) nightCount += p.hours[utcHour];
        }

        const share = nightCount / p.messages;
        if (share > bestShare) {
            bestShare = share;
            best = { id: "nightOwl", userId: p.userId, username: p.username, value: share };
        }
    }

    // Une table qui ne joue jamais la nuit ne décerne pas le badge.
    return bestShare > 0 ? best : null;
}

export function BadgeShowcase({ badges, players }: { badges: Badge[]; players: ChatPlayerStats[] }) {
    const t = useTranslations("game.stats.badges");

    const nightOwl = nightOwlBadge(players);
    const all = nightOwl ? [...badges, nightOwl] : badges;

    if (all.length === 0) {
        return (
            <p className="text-sm text-muted-foreground bg-background rounded-lg border p-3">
                {t("none")}
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {all.map((b) => (
                <div
                    key={b.id}
                    className="bg-background rounded-lg border p-3 flex flex-col items-center gap-1 text-center"
                >
                    <span className="text-3xl">{BADGE_EMOJI[b.id] ?? "🏅"}</span>
                    <span className="text-xs font-bold">{t(`${b.id}.title`)}</span>
                    <span className="text-sm font-medium">{b.username}</span>
                    <span className="text-[11px] text-muted-foreground">{t(`${b.id}.hint`)}</span>
                </div>
            ))}
        </div>
    );
}
