import { resolveSystemId } from "@/lib/system-id";
import { DEFAULT_SKIN } from "./game-skin-context";
import { magnusArchivesSkin } from "./magnus_archives";
import type { GameSkin } from "./types";

/**
 * Registre des skins par systemId. Pour donner un style propre à un nouvel
 * univers : créer `src/themes/<systemId>/` (index.ts + theme.css + composants),
 * l'enregistrer ici, déclarer le thème dans `src/config/gameThemes.ts` et
 * importer sa feuille de style dans `src/app/layout.tsx`.
 */
const SKINS: Record<string, GameSkin> = {
    magnus_archives: magnusArchivesSkin,
};

export function getGameSkin(characterSheet?: string | null): GameSkin {
    if (!characterSheet) return DEFAULT_SKIN;
    return SKINS[resolveSystemId(characterSheet)] ?? DEFAULT_SKIN;
}
