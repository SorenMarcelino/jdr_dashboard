"use client";

import { useEffect, useState } from "react";
import type { TarotGrant, TarotSpread, TarotState } from "@/config/tarot";

/** Valeurs spéciales du choix du tireur (sinon : l'id d'un joueur). */
export const DRAWER_SELF = "__gm";
export const DRAWER_NPC = "__npc";

export type TarotGrantForm = {
    spread: TarotSpread;
    allowReversed: boolean;
    secret: boolean;
    /** Id d'un joueur, DRAWER_SELF (le MJ) ou DRAWER_NPC. */
    drawer: string;
    npcName: string;
};

/**
 * Formulaire du MJ pour accorder un tirage : disposition, inversées, secret,
 * tireur (un joueur, lui-même ou un PNJ). Se cale sur le tirage en cours.
 * `grant` vaut null tant que le formulaire est incomplet (PNJ sans nom).
 */
export function useTarotGrantForm({ state, players, currentUserId, defaultSpread }: {
    state: TarotState | null;
    players: { _id: string }[];
    currentUserId: string;
    defaultSpread: TarotSpread;
}) {
    const [form, setForm] = useState<TarotGrantForm>({
        spread: defaultSpread,
        allowReversed: true,
        secret: false,
        drawer: players[0]?._id ?? DRAWER_SELF,
        npcName: "",
    });

    const active = !!state && state.status !== "idle";
    const liveSpread = active ? state?.spread : undefined;
    const liveReversed = state?.allowReversed;
    const liveSecret = state?.secret;
    const liveDrawerId = state?.drawer?.id;
    const liveDrawerName = state?.drawer?.username;
    const liveNpc = state?.drawer?.npc;
    useEffect(() => {
        if (!liveSpread) return;
        setForm((f) => ({
            spread: liveSpread,
            allowReversed: !!liveReversed,
            secret: !!liveSecret,
            drawer: liveNpc ? DRAWER_NPC : liveDrawerId === currentUserId ? DRAWER_SELF : liveDrawerId ?? f.drawer,
            npcName: liveNpc ? liveDrawerName ?? "" : f.npcName,
        }));
    }, [liveSpread, liveReversed, liveSecret, liveDrawerId, liveDrawerName, liveNpc, currentUserId]);

    // Un joueur parti de la partie n'est plus un choix valable.
    const drawer =
        form.drawer === DRAWER_SELF || form.drawer === DRAWER_NPC || players.some((p) => p._id === form.drawer)
            ? form.drawer
            : players[0]?._id ?? DRAWER_SELF;
    const npcName = form.npcName.trim();
    const base = { spread: form.spread, allowReversed: form.allowReversed, secret: form.secret };

    const grant: TarotGrant | null =
        drawer === DRAWER_NPC
            ? npcName ? { ...base, drawerId: currentUserId, npcName } : null
            : { ...base, drawerId: drawer === DRAWER_SELF ? currentUserId : drawer };

    const update = (patch: Partial<TarotGrantForm>) => setForm((f) => ({ ...f, ...patch }));

    return { form: { ...form, drawer }, update, grant };
}
