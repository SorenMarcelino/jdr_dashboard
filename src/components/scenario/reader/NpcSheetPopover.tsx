"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const API = "http://localhost:5050";

type Props = {
    gameId: string;
    sheetId: string;
    npcName: string;
    onClose: () => void;
};

type SheetData = {
    _id: string;
    systemId: string;
    values: Record<string, unknown>;
    isNpc?: boolean;
    npcName?: string;
};

export function NpcSheetPopover({ gameId, sheetId, npcName, onClose }: Props) {
    const [sheet, setSheet] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupérer toutes les fiches de la partie et trouver celle qui correspond
        axios
            .get(`${API}/games/${gameId}/character-sheets`, { withCredentials: true })
            .then((res) => {
                if (res.data.success) {
                    const found = res.data.sheets?.find(
                        (s: SheetData) => s._id === sheetId
                    );
                    setSheet(found || null);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [gameId, sheetId]);

    const renderValue = (key: string, value: unknown) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "boolean") return value ? "Oui" : "Non";
        return String(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background border rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        {npcName}
                        {sheet?.isNpc && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-normal text-muted-foreground">PNJ</span>
                        )}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <p className="text-xs text-muted-foreground text-center">Chargement...</p>
                    ) : !sheet ? (
                        <p className="text-xs text-muted-foreground text-center">Fiche introuvable</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(sheet.values).map(([key, value]) => {
                                const display = renderValue(key, value);
                                if (!display) return null;
                                return (
                                    <div key={key} className="flex gap-2 text-sm">
                                        <span className="text-muted-foreground shrink-0 font-medium">
                                            {key.replace(/_/g, " ")}:
                                        </span>
                                        <span className="break-words">{display}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
