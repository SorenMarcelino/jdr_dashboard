"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useMediaSync, type StagePlayback } from "./useMediaSync";

type Props = {
    url: string;
    title: string;
    playback: StagePlayback;
    onMediaEl?: (el: HTMLMediaElement | null) => void;
};

// Lecteur audio piloté par le serveur : pas de contrôles natifs, la lecture
// est commandée par les events stage:control du MJ (via useMediaSync).
export function AudioRenderer({ url, title, playback, onMediaEl }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { blocked, retry } = useMediaSync(audioRef, playback);
    const t = useTranslations("stage");

    return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-muted p-4">
            <audio
                ref={(el) => {
                    audioRef.current = el;
                    onMediaEl?.(el);
                }}
                src={url}
                preload="auto"
            />
            <span className="text-3xl" aria-hidden>
                {playback.playing ? "🔊" : "🎵"}
            </span>
            <p className="text-sm font-medium text-center break-all">{title || url}</p>
            <p className="text-xs text-muted-foreground">
                {playback.playing ? t("playing") : t("paused")}
            </p>
            {blocked && (
                <button
                    onClick={retry}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                >
                    {t("enableSound")}
                </button>
            )}
        </div>
    );
}
