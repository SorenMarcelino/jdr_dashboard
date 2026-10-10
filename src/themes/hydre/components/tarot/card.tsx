import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BACK_ART, CORNERS, HYDRE_DECK, hydra, type GoldArt } from "./deck";

// Lames du tarot Hydre : carton noir, dorure à chaud, tranche dorée, coins
// arrondis, ordonnance du Tarot de Marseille (nombre en haut, nom en bas).
// Tailles en em : la lame suit la police de son conteneur (≈ largeur / 14,4).

const GOLD = "url(#hydre-tarot-gold)";
const GOLD_UI = "url(#hydre-tarot-gold-ui)";

/** Dégradés « dorure » et grain du carton. À poser une fois par surface. */
export function HydreTarotDefs() {
    return (
        <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
                <linearGradient id="hydre-tarot-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="150">
                    <stop offset="0" stopColor="#8C6A2E" />
                    <stop offset="0.22" stopColor="#E9CF8A" />
                    <stop offset="0.42" stopColor="#B08A43" />
                    <stop offset="0.6" stopColor="#F3DFA6" />
                    <stop offset="0.8" stopColor="#9C7A38" />
                    <stop offset="1" stopColor="#E2C47F" />
                </linearGradient>
                <linearGradient id="hydre-tarot-gold-ui" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8C6A2E" />
                    <stop offset="0.3" stopColor="#E9CF8A" />
                    <stop offset="0.55" stopColor="#B08A43" />
                    <stop offset="0.8" stopColor="#F3DFA6" />
                    <stop offset="1" stopColor="#9C7A38" />
                </linearGradient>
                <filter id="hydre-tarot-stock">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.62  0 0 0 0 0.4  0 0 0 0.09 0" />
                </filter>
                <filter id="hydre-tarot-leather">
                    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="3" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.015  0 0 0 0 0.01  0 0 0 0.9 -0.15" />
                </filter>
            </defs>
        </svg>
    );
}

/** Grain du carton noir. */
export function Stock() {
    return (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
            <rect width="100%" height="100%" filter="url(#hydre-tarot-stock)" />
        </svg>
    );
}

/** Emblème doré (repère 100 × 150). `weight` épaissit les traits des miniatures. */
export function GoldEmblem({ art, weight = 1, corners, className }: { art: GoldArt; weight?: number; corners?: boolean; className?: string }) {
    return (
        <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet" className={cn("block", className)} aria-hidden="true">
            {corners && <path d={CORNERS} fill="none" stroke={GOLD} strokeWidth={0.6} />}
            <path d={art.h} fill="none" stroke={GOLD} strokeWidth={0.45 * weight} opacity={0.7} />
            <path d={art.fine} fill="none" stroke={GOLD} strokeWidth={0.8 * weight} strokeLinecap="round" strokeLinejoin="round" />
            <path d={art.bold} fill="none" stroke={GOLD} strokeWidth={1.6 * weight} strokeLinecap="round" strokeLinejoin="round" />
            <path d={art.fill} fill={GOLD} />
        </svg>
    );
}

/** Recto : nombre, emblème, nom. Une lame renversée est retournée tête-bêche. */
export function CardFace({ cardId, reversed }: { cardId: string; reversed: boolean }) {
    const t = useTranslations("skins.hydre.tarot");
    const card = HYDRE_DECK[cardId];
    if (!card) return null;

    return (
        <div
            className="relative h-full w-full overflow-hidden rounded-[0.6em] bg-[#100D0B] p-[0.42em] text-[#E2C47F]"
            style={{
                transform: reversed ? "rotate(180deg)" : undefined,
                boxShadow: "0 0 0 0.07em #E2C47F, inset 0 0 0 0.12em #6E5426",
            }}
        >
            <Stock />
            <div
                className="relative flex h-full flex-col border-[0.07em] border-[#C9A25A]"
                style={{ boxShadow: "inset 0 0 0 0.2em #100D0B, inset 0 0 0 0.26em rgba(201, 162, 90, 0.5)" }}
            >
                <div className="hydre-display flex h-[1.9em] shrink-0 items-center justify-center gap-[0.6em] border-b-[0.07em] border-[#C9A25A] text-[1.05em] tracking-[0.26em]">
                    <span className="text-[0.6em]" aria-hidden="true">◆</span>
                    {card.num}
                    <span className="text-[0.6em]" aria-hidden="true">◆</span>
                </div>
                <div className="relative min-h-0 flex-1">
                    <GoldEmblem art={card.art} corners className="absolute inset-0 h-full w-full" />
                </div>
                <div className="hydre-display flex h-[2.05em] shrink-0 items-center justify-center border-t-[0.07em] border-[#C9A25A] px-[0.3em] text-center text-[0.9em] uppercase leading-[1.05] tracking-[0.14em]">
                    {card.nameless ? "" : t(`cards.${cardId}.name`)}
                </div>
            </div>
        </div>
    );
}

/** Verso : croisillon doré, l'Hydre dans l'Ouroboros. */
export function CardBack({ label }: { label?: string }) {
    return (
        <div
            className="relative flex h-full w-full flex-col items-center justify-center gap-[0.4em] rounded-[0.6em] bg-[#100D0B]"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(201, 162, 90, 0.2) 0 0.05em, transparent 0.05em 0.55em), repeating-linear-gradient(-45deg, rgba(201, 162, 90, 0.2) 0 0.05em, transparent 0.05em 0.55em)",
                boxShadow: "0 0 0 0.07em #E2C47F, inset 0 0 0 0.45em #100D0B, inset 0 0 0 0.52em #B08A43",
            }}
        >
            <GoldEmblem art={BACK_ART} weight={1.2} className="w-[66%]" />
            {label && <span className="hydre-display text-[0.95em] tracking-[0.3em] text-[#E2C47F]">{label}</span>}
        </div>
    );
}

const SEAL = hydra(0, 12, 11, 13, -2, 1.8);

/** Cachet doré de l'Hydre (pli scellé). */
export function HydraSeal({ className, label }: { className?: string; label?: string }) {
    return (
        <svg viewBox="-30 -30 60 60" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
            <circle r="27" fill="#100D0B" stroke={GOLD_UI} strokeWidth="1.6" />
            <circle r="22" fill="none" stroke={GOLD_UI} strokeWidth="0.7" />
            <path d={SEAL.necks} fill="none" stroke={GOLD_UI} strokeWidth="1.4" strokeLinecap="round" />
            <path d={SEAL.heads} fill={GOLD_UI} />
        </svg>
    );
}
