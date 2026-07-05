"use client";

import { useRef } from "react";
import { useMediaSync, type StagePlayback } from "./useMediaSync";

type Props = {
    url: string;
    title: string;
    playback: StagePlayback;
    onMediaEl?: (el: HTMLMediaElement | null) => void;
};

// Lecteur vidéo (fichiers directs mp4/webm) piloté par le serveur : pas de
// contrôles natifs, la lecture est commandée par les events stage:control.
export function VideoRenderer({ url, title, playback, onMediaEl }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const { blocked, retry } = useMediaSync(videoRef, playback);

    return (
        <div className="relative h-full w-full flex items-center justify-center bg-muted">
            <video
                ref={(el) => {
                    videoRef.current = el;
                    onMediaEl?.(el);
                }}
                src={url}
                preload="auto"
                playsInline
                className="max-h-full max-w-full object-contain"
                aria-label={title || "Vidéo diffusée"}
            />
            {blocked && (
                <button
                    onClick={retry}
                    className="absolute inset-0 m-auto h-fit w-fit px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                >
                    ▶ Lancer la lecture
                </button>
            )}
        </div>
    );
}
