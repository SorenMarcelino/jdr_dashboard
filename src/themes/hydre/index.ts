import type { GameSkin } from "@/themes/types";
import { HydreSessionHeader } from "./components/session-header";
import { HydrePlayerSelector } from "./components/player-selector";
import { HydreWidgetShell } from "./components/widget-shell";
import { HydreCharacterSheet } from "./components/character-sheet";
import { HydreChatInput, HydreDiceBar, HydreDiceRollMessage, HydreTextMessage } from "./components/journal";

/**
 * Skin « cabinet du club » d'HYDRE – Chasseurs de monstres : boiseries
 * sombres, laiton et engrenages, documents sur parchemin, fiche reprenant la
 * fiche papier du livre de base. Couleurs et polices : ./theme.css.
 */
export const hydreSkin: GameSkin = {
    id: "hydre",
    pageClassName: "bg-background",
    SessionHeader: HydreSessionHeader,
    PlayerSelector: HydrePlayerSelector,
    WidgetShell: HydreWidgetShell,
    TextMessage: HydreTextMessage,
    DiceRollMessage: HydreDiceRollMessage,
    DiceBar: HydreDiceBar,
    ChatInput: HydreChatInput,
    CharacterSheet: HydreCharacterSheet,
};
