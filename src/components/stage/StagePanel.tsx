"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useSocket,
    type StageState,
    type StageMediaKind,
    type StageControlAction,
} from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageRenderer } from "./renderers/ImageRenderer";
import { AudioRenderer } from "./renderers/AudioRenderer";
import { VideoRenderer } from "./renderers/VideoRenderer";
import { ModelRenderer } from "./renderers/ModelRenderer";

type Props = {
    gameId: string;
    isMJ: boolean;
};

const KIND_KEYS: Record<StageMediaKind, string> = {
    image: "kindImage",
    audio: "kindAudio",
    video: "kindVideo",
    model3d: "kindModel3d",
};

// Détecte le type de média à partir de l'extension du chemin de l'URL.
// Retourne null si l'extension est inconnue (le MJ choisit alors à la main).
function detectKind(rawUrl: string): StageMediaKind | null {
    let path: string;
    try {
        path = new URL(rawUrl).pathname.toLowerCase();
    } catch {
        return null;
    }
    if (/\.(mp3|ogg|wav|m4a|flac)$/.test(path)) return "audio";
    if (/\.(mp4|webm)$/.test(path)) return "video";
    if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return "image";
    if (/\.(glb|gltf)$/.test(path)) return "model3d";
    return null;
}

function formatTime(sec: number) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// Contrôles de lecture MJ pour audio/vidéo : play/pause + barre de seek.
// Le MJ n'agit jamais directement sur son élément média : il émet
// stage:control, le serveur horodate et rebroadcast à toute la room (MJ
// inclus) → tout le monde applique le même ordre, même horloge.
function MjPlaybackControls({
    playing,
    mediaEl,
    onControl,
}: {
    playing: boolean;
    mediaEl: HTMLMediaElement | null;
    onControl: (action: StageControlAction, positionSec: number) => void;
}) {
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const t = useTranslations("stage");

    useEffect(() => {
        if (!mediaEl) return;
        const update = () => {
            setPosition(mediaEl.currentTime);
            if (Number.isFinite(mediaEl.duration)) setDuration(mediaEl.duration);
        };
        update();
        mediaEl.addEventListener("timeupdate", update);
        mediaEl.addEventListener("durationchange", update);
        return () => {
            mediaEl.removeEventListener("timeupdate", update);
            mediaEl.removeEventListener("durationchange", update);
        };
    }, [mediaEl]);

    return (
        <div className="flex items-center gap-2 px-3 py-2 border-t bg-muted/40">
            <Button
                size="sm"
                variant="outline"
                onClick={() =>
                    onControl(playing ? "pause" : "play", mediaEl?.currentTime ?? 0)
                }
            >
                {playing ? t("pause") : t("play")}
            </Button>
            <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(position, duration || 0)}
                onChange={(e) => onControl("seek", Number(e.target.value))}
                className="flex-1 accent-primary"
                aria-label={t("seekAria")}
            />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatTime(position)} / {formatTime(duration)}
            </span>
        </div>
    );
}

// Widget « Scène » : le MJ diffuse un média par URL (image, audio, vidéo,
// modèle 3D) à tous les membres de la partie ; les joueurs le reçoivent en
// lecture seule (le 3D reste manipulable localement).
export function StagePanel({ gameId, isMJ }: Props) {
    const { connected, joinGame, setStage, clearStage, controlStage, onStageUpdate, onStageControl } =
        useSocket();
    const [stage, setStageState] = useState<StageState | null>(null);
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [kindChoice, setKindChoice] = useState<StageMediaKind | "auto">("auto");
    const [mediaEl, setMediaEl] = useState<HTMLMediaElement | null>(null);
    const t = useTranslations("stage");

    const detectedKind = useMemo(() => detectKind(url), [url]);
    const effectiveKind = kindChoice === "auto" ? detectedKind : kindChoice;

    // Rejoint la room (idempotent, ChatPanel la rejoint aussi) : garantit de
    // recevoir le stage:update de late-join même si ce widget est seul monté.
    useEffect(() => {
        if (!connected) return;
        joinGame(gameId);
    }, [connected, gameId, joinGame]);

    useEffect(() => {
        const unsubUpdate = onStageUpdate((state) => {
            if (state.gameId !== gameId) return;
            setStageState(state);
        });
        const unsubControl = onStageControl((control) => {
            if (control.gameId !== gameId) return;
            setStageState((prev) =>
                prev?.media
                    ? {
                          ...prev,
                          playback: {
                              playing: control.playing,
                              positionSec: control.positionSec,
                              updatedAtServerMs: control.serverTimeMs,
                          },
                      }
                    : prev
            );
        });
        return () => {
            unsubUpdate();
            unsubControl();
        };
    }, [gameId, onStageUpdate, onStageControl]);

    const handleBroadcast = () => {
        if (!url.trim() || !effectiveKind) return;
        setStage(gameId, { kind: effectiveKind, url: url.trim(), title: title.trim() });
    };

    const media = stage?.media ?? null;
    const playback = stage?.playback ?? { playing: false, positionSec: 0, updatedAtServerMs: 0 };
    const isPlayable = media?.kind === "audio" || media?.kind === "video";

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Formulaire de diffusion (MJ uniquement) */}
            {isMJ && (
                <div className="shrink-0 flex flex-col gap-2 p-3 border-b">
                    <div className="flex gap-2">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t("mediaPlaceholder")}
                            className="h-8 text-xs"
                        />
                        <select
                            value={kindChoice}
                            onChange={(e) => setKindChoice(e.target.value as StageMediaKind | "auto")}
                            className="h-8 rounded-md border bg-background px-2 text-xs"
                            aria-label={t("mediaTypeAria")}
                        >
                            <option value="auto">
                                {t("auto")}{detectedKind ? ` (${t(KIND_KEYS[detectedKind])})` : ""}
                            </option>
                            {Object.entries(KIND_KEYS).map(([value, key]) => (
                                <option key={value} value={value}>{t(key)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("titlePlaceholder")}
                            className="h-8 text-xs"
                        />
                        <Button
                            size="sm"
                            onClick={handleBroadcast}
                            disabled={!url.trim() || !effectiveKind}
                        >
                            {t("broadcast")}
                        </Button>
                        {media && (
                            <Button size="sm" variant="outline" onClick={() => clearStage(gameId)}>
                                {t("remove")}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Média courant */}
            <div className="flex-1 min-h-0">
                {!media ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <span className="text-2xl">🎬</span>
                        <p className="text-xs">
                            {isMJ ? t("gmPrompt") : t("noMedia")}
                        </p>
                    </div>
                ) : media.kind === "image" ? (
                    <ImageRenderer url={media.url} title={media.title} />
                ) : media.kind === "audio" ? (
                    <AudioRenderer
                        url={media.url}
                        title={media.title}
                        playback={playback}
                        onMediaEl={isMJ ? setMediaEl : undefined}
                    />
                ) : media.kind === "video" ? (
                    <VideoRenderer
                        url={media.url}
                        title={media.title}
                        playback={playback}
                        onMediaEl={isMJ ? setMediaEl : undefined}
                    />
                ) : (
                    <ModelRenderer url={media.url} title={media.title} />
                )}
            </div>

            {/* Contrôles de lecture (MJ, audio/vidéo uniquement) */}
            {isMJ && isPlayable && (
                <MjPlaybackControls
                    playing={playback.playing}
                    mediaEl={mediaEl}
                    onControl={(action, positionSec) => controlStage(gameId, action, positionSec)}
                />
            )}
        </div>
    );
}
