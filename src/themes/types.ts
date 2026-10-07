import type { ComponentType, ReactNode } from "react";
import type { ChatMessage } from "@/contexts/SocketContext";
import type { DiceType } from "@/config/diceConfig";
import type { SheetInstance, Template } from "@/components/character-sheet/GenericCharacterSheet";

/** Infos de la partie dont l'en-tête de session a besoin. */
export type SessionGame = {
    name: string;
    characterSheet: string;
    inviteCode: string;
};

export type SessionHeaderProps = {
    game: SessionGame;
    gameId: string;
    isMJ: boolean;
};

export type PlayerSelectorProps = {
    players: { _id: string; username: string }[];
    selectedId?: string;
    onSelect: (playerId: string) => void;
};

export type WidgetShellProps = {
    /** Identifiant du widget (sheet, stage, chat…) : le skin peut en déduire sa matière. */
    id: string;
    /** Position du widget dans la liste (numérotation éventuelle). */
    index: number;
    title: string;
    headerRight?: ReactNode;
    onDetach?: () => void;
    /** Rendu dans une fenêtre détachée : pas de poignée ni d'en-tête, juste la surface. */
    detached?: boolean;
    children: ReactNode;
};

export type ChatMessageProps = {
    message: ChatMessage;
    isOwn: boolean;
    /** Le message vient du MJ de la partie. */
    isGm: boolean;
};

export type DiceBarProps = {
    onRoll: (diceType: DiceType, quantity: number) => void;
    disabled?: boolean;
};

export type ChatInputProps = {
    onSend: (content: string) => void;
    disabled?: boolean;
};

export type CharacterSheetProps = {
    template: Template;
    instance: SheetInstance | null;
    isEditable: boolean;
    onSave: (values: Record<string, unknown>) => Promise<void>;
};

/**
 * Skin d'un univers de jeu : remplace tout ou partie des composants du
 * tableau de bord de partie. Chaque emplacement laissé vide retombe sur le
 * composant par défaut de l'app. Les couleurs et polices du skin vivent dans
 * sa feuille de style (`src/themes/<systemId>/theme.css`), activée par
 * `data-game-theme` (cf. useGameTheme).
 */
export type GameSkin = {
    id: string;
    /** Classes ajoutées au conteneur de la page de partie (fond, police…). */
    pageClassName?: string;
    SessionHeader?: ComponentType<SessionHeaderProps>;
    PlayerSelector?: ComponentType<PlayerSelectorProps>;
    WidgetShell?: ComponentType<WidgetShellProps>;
    TextMessage?: ComponentType<ChatMessageProps>;
    DiceRollMessage?: ComponentType<ChatMessageProps>;
    DiceBar?: ComponentType<DiceBarProps>;
    ChatInput?: ComponentType<ChatInputProps>;
    CharacterSheet?: ComponentType<CharacterSheetProps>;
};
