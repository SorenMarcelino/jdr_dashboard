"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export type StagePlayback = {
    playing: boolean;
    positionSec: number;
    updatedAtServerMs: number;
};

// Synchronise un élément <audio>/<video> sur l'état de lecture diffusé par le
// serveur. La position cible est calculée avec l'horodatage serveur : pendant
// la lecture, target = positionSec + temps écoulé depuis l'ordre du MJ. On ne
// corrige la position que si la dérive dépasse 0,5 s (évite les micro-sauts).
export function useMediaSync(
    elRef: RefObject<HTMLMediaElement | null>,
    playback: StagePlayback
) {
    // Lecture bloquée par la politique d'autoplay du navigateur : il faut un
    // geste utilisateur pour démarrer le son côté joueur.
    const [blocked, setBlocked] = useState(false);

    const apply = useCallback(() => {
        const el = elRef.current;
        if (!el) return;

        const target =
            playback.playing && playback.updatedAtServerMs > 0
                ? playback.positionSec + (Date.now() - playback.updatedAtServerMs) / 1000
                : playback.positionSec;

        if (Math.abs(el.currentTime - target) > 0.5) {
            el.currentTime = target;
        }

        if (playback.playing) {
            el.play()
                .then(() => setBlocked(false))
                .catch(() => setBlocked(true));
        } else {
            el.pause();
        }
    }, [elRef, playback]);

    useEffect(() => {
        apply();
        // Si les métadonnées n'étaient pas encore chargées au moment de
        // l'ordre (late-join), on se recale dès qu'elles arrivent.
        const el = elRef.current;
        if (!el) return;
        el.addEventListener("loadedmetadata", apply);
        return () => el.removeEventListener("loadedmetadata", apply);
    }, [apply, elRef]);

    return { blocked, retry: apply };
}
