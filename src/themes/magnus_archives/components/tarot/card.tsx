import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ARCHIVES_DECK } from "./deck";

// Lames du tarot Magnus : pièces photocopiées, trombone, tampon violet de
// l'Institut. Toutes les tailles sont en em : la lame suit la taille de police
// de son conteneur (≈ largeur / 14,4).

/** Filtres SVG partagés (contour tremblé, encre de tampon, grain). À poser une fois par surface. */
export function ArchivesTarotFilters() {
    return (
        <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
                <filter id="archives-tarot-rough" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
                </filter>
                <filter id="archives-tarot-ink" x="-5%" y="-20%" width="110%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="2" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
                </filter>
                <filter id="archives-tarot-grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </defs>
        </svg>
    );
}

/** Grain de photocopie posé sur une surface (mode de fusion au choix). */
export function Grain({ opacity, blend }: { opacity: number; blend: "multiply" | "screen" | "overlay" }) {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ opacity, mixBlendMode: blend }}
        >
            <rect width="100%" height="100%" filter="url(#archives-tarot-grain)" />
        </svg>
    );
}

/** Illustration photocopiée d'une lame (fond noir). */
export function CardArt({ cardId, className }: { cardId: string; className?: string }) {
    const card = ARCHIVES_DECK[cardId];
    return (
        <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" className={cn("block h-full w-full", className)} aria-hidden="true">
            <g filter="url(#archives-tarot-rough)">
                {card?.art.map((layer, i) => (
                    <path
                        key={i}
                        d={layer.d}
                        fill={layer.fill}
                        stroke={layer.stroke}
                        strokeWidth={layer.width}
                        opacity={layer.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
            </g>
        </svg>
    );
}

/** Recto : pièce versée au dossier. Une lame à l'envers est retournée tête-bêche. */
export function CardFace({ cardId, reversed }: { cardId: string; reversed: boolean }) {
    const t = useTranslations("skins.magnus.tarot");
    const card = ARCHIVES_DECK[cardId];
    if (!card) return null;

    return (
        <div
            className="relative flex h-full w-full flex-col gap-[0.45em] overflow-hidden bg-[#DAD6C8] px-[0.7em] pb-[0.6em] pt-[0.7em] text-left text-[color:var(--archives-ink)]"
            style={{ transform: reversed ? "rotate(180deg)" : undefined }}
        >
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#161716]">
                <CardArt cardId={cardId} />
                <Grain opacity={0.32} blend="screen" />
            </div>
            <div className="flex items-baseline justify-between gap-[0.4em]">
                <span className="archives-typewriter text-[1.35em] leading-[1.05]">{t(`cards.${cardId}.name`)}</span>
                <span className="archives-text text-[0.8em]">Nº {card.num}</span>
            </div>
            <span
                className="archives-text self-start border-[0.12em] border-[color:var(--archives-stamp)] px-[0.45em] py-[0.15em] text-[0.62em] font-bold tracking-[0.08em] text-[color:var(--archives-stamp)] opacity-85"
                style={{ transform: "rotate(-3deg)" }}
            >
                {t("stamp", { code: card.code })}
            </span>
            <Grain opacity={0.22} blend="multiply" />
        </div>
    );
}

/** Verso : fiche de consultation de l'Institut (tamponnée « confidentiel » si besoin). */
export function CardBack({ confidential }: { confidential?: boolean }) {
    const t = useTranslations("skins.magnus.tarot");
    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#D6D0BE] px-[0.8em] py-[0.9em] text-[color:var(--archives-ink)]">
            <div className="archives-text text-center text-[0.9em] font-bold tracking-[0.05em]">{t("backInstitute")}</div>
            <div className="archives-text border-b-[0.1em] border-[color:var(--archives-ink)] pb-[0.4em] text-center text-[0.75em]">
                {t("backSlip")}
            </div>
            <div
                className="min-h-0 flex-1"
                style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 1.75em, rgba(78, 63, 126, 0.45) 1.75em 1.85em)" }}
            />
            <svg viewBox="0 0 100 100" className="mx-auto mt-[0.4em] w-[38%] opacity-80" aria-hidden="true">
                <path
                    d="M50 10 A40 40 0 1 0 50.1 10 Z M20 50 Q50 25 80 50 Q50 75 20 50 Z M50 40 A10 10 0 1 0 50.1 40 Z"
                    fill="none"
                    stroke="#1E1F1C"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    filter="url(#archives-tarot-rough)"
                />
            </svg>
            {confidential && (
                <span
                    className="archives-text absolute left-1/2 top-1/2 border-[0.2em] border-[#8E1C14] px-[0.5em] py-[0.2em] text-[1.05em] font-bold tracking-[0.12em] text-[#8E1C14]"
                    style={{ transform: "translate(-50%, -50%) rotate(-14deg)", filter: "url(#archives-tarot-ink)" }}
                >
                    {t("confidential")}
                </span>
            )}
            <Grain opacity={0.22} blend="multiply" />
        </div>
    );
}

export function PaperClip({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 24 46" className={className} style={style} aria-hidden="true">
            <path
                d="M7 4 L7 34 Q7 42 13 42 Q19 42 19 34 L19 10 Q19 5 14.5 5 Q10 5 10 10 L10 30"
                fill="none"
                stroke="#A3A39B"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    );
}
