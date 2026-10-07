import type { GameSkin } from "@/themes/types";
import { ArchivesSessionHeader } from "./components/session-header";
import { ArchivesPlayerSelector } from "./components/player-selector";
import { ArchivesWidgetShell } from "./components/widget-shell";
import { ArchivesCharacterSheet } from "./components/character-sheet";
import {
    ArchivesChatInput,
    ArchivesDiceBar,
    ArchivesDiceRollMessage,
    ArchivesTextMessage,
} from "./components/transcript";

/**
 * Skin « dossier d'archives » de The Magnus Archives : bureau sombre,
 * documents en papier gris, onglets de chemise, transcription d'enregistrement.
 * Couleurs et polices : ./theme.css.
 */
export const magnusArchivesSkin: GameSkin = {
    id: "magnus_archives",
    pageClassName: "bg-background",
    SessionHeader: ArchivesSessionHeader,
    PlayerSelector: ArchivesPlayerSelector,
    WidgetShell: ArchivesWidgetShell,
    TextMessage: ArchivesTextMessage,
    DiceRollMessage: ArchivesDiceRollMessage,
    DiceBar: ArchivesDiceBar,
    ChatInput: ArchivesChatInput,
    CharacterSheet: ArchivesCharacterSheet,
};
