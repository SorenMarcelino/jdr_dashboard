import { resolveSystemId } from "@/lib/system-id";

/** Un asset logo et ses dimensions intrinsèques (pour éviter le CLS). */
export interface LogoAsset {
    /** Chemin servi depuis /public. */
    src: string;
    width: number;
    height: number;
}

export interface GameLogo {
    /** Variante large, privilégiée dans la navbar. */
    horizontal?: LogoAsset;
    /** Variante carrée/portrait (toujours présente, sert de fallback). */
    vertical: LogoAsset;
    /** Nom lisible (texte alternatif). */
    label: string;
}

/** Logo de l'application « What Do You Do? » — affiché hors partie. */
export const GENERIC_LOGO: GameLogo = {
    vertical: { src: "/images/logos/generic/generic-vertical.png", width: 1254, height: 1254 },
    label: "What Do You Do?",
};

/**
 * Registre des logos par identifiant de système.
 * Pour ajouter un système : déposer les assets dans
 * /public/images/logos/<systemId>/ puis ajouter une entrée ici
 * (clé = systemId, cf. resolveSystemId).
 */
const SYSTEM_LOGOS: Record<string, GameLogo> = {
    magnus_archives: {
        horizontal: { src: "/images/logos/magnus_archives/magnus-archives-horizontal.png", width: 2048, height: 768 },
        vertical: { src: "/images/logos/magnus_archives/magnus-archives-vertical.png", width: 1254, height: 1254 },
        label: "The Magnus Archives",
    },
};

/**
 * Retourne le logo du jeu en cours à partir du champ `characterSheet` du Game
 * (identifiant brut, résolu en systemId). Fallback sur le logo générique si
 * aucun jeu n'est fourni ou si le système n'a pas de logo dédié.
 */
export function getGameLogo(characterSheet?: string | null): GameLogo {
    if (!characterSheet) return GENERIC_LOGO;
    const systemId = resolveSystemId(characterSheet);
    return SYSTEM_LOGOS[systemId] ?? GENERIC_LOGO;
}

/** Variante à utiliser dans la navbar (horizontale si dispo, sinon verticale). */
export function getNavbarLogoAsset(logo: GameLogo): LogoAsset {
    return logo.horizontal ?? logo.vertical;
}
