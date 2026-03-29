"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search } from "lucide-react";

const API = "http://localhost:5050";

type NpcSheet = {
    _id: string;
    playerId: { _id: string; username: string } | string | null;
    values: Record<string, unknown>;
    systemId: string;
    isNpc?: boolean;
    npcName?: string;
};

type Props = {
    gameId: string;
    onSelect: (sheetId: string, npcName: string) => void;
    onClose: () => void;
};

export function NpcSelector({ gameId, onSelect, onClose }: Props) {
    const [sheets, setSheets] = useState<NpcSheet[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}/character-sheets`, { withCredentials: true })
            .then((res) => {
                if (res.data.success) setSheets(res.data.sheets || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [gameId]);

    const getSheetName = (sheet: NpcSheet): string => {
        if (sheet.isNpc && sheet.npcName) return sheet.npcName;
        const name = sheet.values?.name || sheet.values?.character_name;
        if (typeof name === "string" && name) return name;
        if (typeof sheet.playerId === "object" && sheet.playerId?.username) {
            return sheet.playerId.username;
        }
        return "Sans nom";
    };

    const npcSheets = sheets.filter((s) => s.isNpc);
    const playerSheets = sheets.filter((s) => !s.isNpc);

    const filterBySearch = (list: NpcSheet[]) =>
        list.filter((s) => getSheetName(s).toLowerCase().includes(search.toLowerCase()));

    const filteredNpc = filterBySearch(npcSheets);
    const filteredPlayers = filterBySearch(playerSheets);

    const renderSheet = (sheet: NpcSheet) => (
        <button
            key={sheet._id}
            onClick={() => onSelect(sheet._id, getSheetName(sheet))}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2"
        >
            <span>{getSheetName(sheet)}</span>
            {sheet.isNpc && (
                <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                    PNJ
                </span>
            )}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background border rounded-lg shadow-lg w-80 max-h-96 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-3 border-b">
                    <h3 className="text-sm font-semibold mb-2">Lier un personnage</h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="Rechercher un personnage..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded bg-background"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    {loading ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Chargement...</p>
                    ) : filteredNpc.length === 0 && filteredPlayers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Aucun personnage trouvé</p>
                    ) : (
                        <>
                            {filteredNpc.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-2 pb-1">
                                        PNJ
                                    </p>
                                    {filteredNpc.map(renderSheet)}
                                </div>
                            )}
                            {filteredPlayers.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-2 pb-1">
                                        Joueurs
                                    </p>
                                    {filteredPlayers.map(renderSheet)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
