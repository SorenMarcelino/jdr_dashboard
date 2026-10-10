import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Ornements partagés du skin Hydre : engrenages de laiton et plaques de section.

/** Tracé d'une roue dentée centrée en (0,0) : `teeth` dents entre rRoot et rTip. */
function gearPath(teeth: number, rRoot: number, rTip: number): string {
    const step = (Math.PI * 2) / teeth;
    const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
    let d = "";
    for (let i = 0; i < teeth; i++) {
        const a = i * step;
        // Dent trapézoïdale : flanc montant, sommet, flanc descendant, creux.
        d += `${i === 0 ? "M" : "L"}${pt(rRoot, a)} L${pt(rTip, a + step * 0.15)} L${pt(rTip, a + step * 0.45)} L${pt(rRoot, a + step * 0.6)} `;
    }
    return `${d}Z`;
}

const MEDALLION_GEAR = gearPath(18, 44, 49);
const DECOR_GEAR = gearPath(12, 40, 48);

/**
 * Médaillon-engrenage des caractéristiques et compteurs (cf. fiche papier) :
 * couronne dentée de laiton, cœur de parchemin où s'écrit la valeur.
 */
export function GearMedallion({ children, className }: { children: ReactNode; className?: string }) {
    // useId peut contenir « : » ou des guillemets, mal tolérés dans url(#…).
    const gradientId = `hydre-brass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    return (
        <div className={cn("relative aspect-square", className)}>
            <svg aria-hidden="true" viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_2px_2px_rgba(46,33,22,0.35)]">
                <defs>
                    <radialGradient id={gradientId} cx="35%" cy="30%" r="80%">
                        <stop offset="0" stopColor="#F0D79A" />
                        <stop offset="0.45" stopColor="#C9A25A" />
                        <stop offset="1" stopColor="#6E5323" />
                    </radialGradient>
                </defs>
                <path d={MEDALLION_GEAR} fill={`url(#${gradientId})`} stroke="#5C4419" strokeWidth="0.8" />
                <circle r="38" fill="none" stroke="#7A5C28" strokeWidth="1.2" />
                <circle r="35" fill="#F8F1DF" stroke="#E6C987" strokeWidth="2" />
                <circle r="33" fill="none" stroke="rgba(122,92,40,0.35)" strokeWidth="0.6" />
            </svg>
            <div className="absolute inset-[16%] flex items-center justify-center">{children}</div>
        </div>
    );
}

/** Anneau de laiton simple (points de vie, protection, initiative). */
export function BrassRing({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "relative flex aspect-square items-center justify-center rounded-full border-[3px] border-[color:var(--hydre-brass)] bg-[color:var(--hydre-parchment-light)]",
                "shadow-[inset_0_0_0_2px_var(--hydre-brass-light),inset_0_2px_6px_rgba(46,33,22,0.25),0_2px_3px_rgba(46,33,22,0.3)]",
                className
            )}
        >
            {children}
        </div>
    );
}

/** Engrenage décoratif (en-tête de session, filigranes). */
export function DecorGear({ className, spokes = true }: { className?: string; spokes?: boolean }) {
    return (
        <svg aria-hidden="true" viewBox="-50 -50 100 100" className={className} fill="none" stroke="currentColor">
            <path d={DECOR_GEAR} strokeWidth="1.5" />
            <circle r="30" strokeWidth="1.5" />
            <circle r="8" strokeWidth="1.5" />
            {spokes &&
                [0, 60, 120].map((deg) => (
                    <line key={deg} x1="0" y1="-30" x2="0" y2="30" strokeWidth="1.5" transform={`rotate(${deg})`} />
                ))}
        </svg>
    );
}

/** Bandeau de section : plaque sombre à pans coupés, liseré de laiton. */
export function Plaque({ children, className, as: Tag = "h3" }: { children: ReactNode; className?: string; as?: "h2" | "h3" | "span" }) {
    return (
        <Tag className={cn("hydre-plaque inline-block max-w-full", className)}>
            <span className="hydre-display truncate px-5 py-1 text-[15px] uppercase leading-tight tracking-wide">{children}</span>
        </Tag>
    );
}
