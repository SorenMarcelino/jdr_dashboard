"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslations } from "next-intl";
import { GenericCharacterSheet, Template as SheetTemplate } from "./GenericCharacterSheet";
import { API_URL } from "@/lib/api";
import { useGameSkin } from "@/themes/game-skin-context";

type Template = SheetTemplate & {
    systemId: string;
};

type Instance = {
    _id?: string;
    systemId: string;
    values: Record<string, unknown>;
    gameId?: string;
    playerId?: string;
};

type Props = {
    systemId: string;
    gameId: string;
    playerId?: string; // si fourni, le MJ voit la fiche de ce joueur (read-only)
    isEditable?: boolean;
};

const API = API_URL;

export function CharacterSheetViewer({ systemId, gameId, playerId, isEditable = false }: Props) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [instance, setInstance] = useState<Instance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("characterSheet");
    const Sheet = useGameSkin().CharacterSheet ?? GenericCharacterSheet;

    useEffect(() => {
        const load = async () => {
            try {
                const [tplRes, sheetRes] = await Promise.all([
                    axios.get(`${API}/character-sheets/templates/${systemId}`, { withCredentials: true }),
                    playerId
                        ? axios.get(`${API}/games/${gameId}/character-sheets`, { withCredentials: true })
                            .then((r) => ({
                                data: {
                                    success: true,
                                    sheet: r.data.sheets?.find((s: Instance & { playerId: { _id: string } | string }) => {
                                        const pid = typeof s.playerId === "object" ? (s.playerId as { _id: string })._id : s.playerId;
                                        return pid === playerId;
                                    }) || null,
                                },
                            }))
                        : axios.get(`${API}/games/${gameId}/character-sheets/me`, { withCredentials: true }),
                ]);

                if (tplRes.data.success) setTemplate(tplRes.data.template);
                if (sheetRes.data.success) setInstance(sheetRes.data.sheet);
            } catch (err) {
                console.error("Erreur chargement fiche:", err);
                setError(t("loadError"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [systemId, gameId, playerId]);

    const handleSave = async (values: Record<string, unknown>) => {
        try {
            if (instance?._id) {
                const { data } = await axios.put(
                    `${API}/games/${gameId}/character-sheets/${instance._id}`,
                    { values },
                    { withCredentials: true }
                );
                if (data.success) setInstance(data.sheet);
            } else {
                const { data } = await axios.post(
                    `${API}/games/${gameId}/character-sheets`,
                    // playerId fourni quand le MJ crée la fiche d'un joueur ;
                    // absent → le serveur crée la fiche de l'utilisateur courant.
                    { systemId, values, playerId },
                    { withCredentials: true }
                );
                if (data.success) setInstance(data.sheet);
            }
        } catch (err) {
            console.error("Erreur sauvegarde:", err);
            throw err;
        }
    };

    if (loading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
    if (error) return <p className="text-sm text-destructive">{error}</p>;
    if (!template) return <p className="text-sm text-muted-foreground">{t("templateNotFound")}</p>;

    return (
        <Sheet
            // Remonte la fiche quand le MJ change de joueur : son état local
            // est initialisé une seule fois à partir de l'instance.
            key={instance?._id ?? playerId ?? "me"}
            template={template}
            instance={instance}
            isEditable={isEditable}
            onSave={handleSave}
        />
    );
}
