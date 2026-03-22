"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { MagnusArchivesSheet } from "./MagnusArchivesSheet";

type Template = {
    systemId: string;
    fields: unknown[];
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

const API = "http://localhost:5050";

export function CharacterSheetViewer({ systemId, gameId, playerId, isEditable = false }: Props) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [instance, setInstance] = useState<Instance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setError("Impossible de charger la fiche.");
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
                    { systemId, values },
                    { withCredentials: true }
                );
                if (data.success) setInstance(data.sheet);
            }
        } catch (err) {
            console.error("Erreur sauvegarde:", err);
            throw err;
        }
    };

    if (loading) return <p className="text-sm text-muted-foreground">Chargement de la fiche...</p>;
    if (error) return <p className="text-sm text-destructive">{error}</p>;
    if (!template) return <p className="text-sm text-muted-foreground">Template introuvable.</p>;

    if (systemId === "magnus_archives") {
        return (
            <MagnusArchivesSheet
                template={template as Parameters<typeof MagnusArchivesSheet>[0]["template"]}
                instance={instance}
                isEditable={isEditable}
                onSave={handleSave}
            />
        );
    }

    return <p className="text-sm text-muted-foreground">Système de fiche non supporté : {systemId}</p>;
}
