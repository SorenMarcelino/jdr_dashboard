"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnusArchivesSheet } from "@/components/character-sheet/MagnusArchivesSheet";
import type { FieldDef } from "@/components/character-sheet/CharacterSheetField";

const API = "http://localhost:5050";

type NpcSheet = {
    _id: string;
    npcName: string;
    systemId: string;
    values: Record<string, unknown>;
};

type Template = {
    systemId: string;
    fields: FieldDef[];
};

type Props = {
    gameId: string;
    systemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type View = { type: "list" } | { type: "create" } | { type: "edit"; sheet: NpcSheet };

export function NpcManager({ gameId, systemId, open, onOpenChange }: Props) {
    const [view, setView] = useState<View>({ type: "list" });
    const [sheets, setSheets] = useState<NpcSheet[]>([]);
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [npcName, setNpcName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const loadSheets = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/games/${gameId}/npc-sheets`, { withCredentials: true });
            if (data.success) setSheets(data.sheets);
        } catch {
            /* ignore */
        }
    }, [gameId]);

    const loadTemplate = useCallback(async () => {
        if (!systemId) return;
        try {
            const { data } = await axios.get(`${API}/character-sheets/templates/${systemId}`, { withCredentials: true });
            if (data.success) setTemplate(data.template);
        } catch {
            /* ignore */
        }
    }, [systemId]);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        Promise.all([loadSheets(), loadTemplate()]).finally(() => setLoading(false));
    }, [open, loadSheets, loadTemplate]);

    // Reset view when dialog closes
    useEffect(() => {
        if (!open) {
            setView({ type: "list" });
            setNpcName("");
        }
    }, [open]);

    const handleCreate = async () => {
        if (!npcName.trim() || !systemId) return;
        setCreating(true);
        try {
            const { data } = await axios.post(
                `${API}/games/${gameId}/npc-sheets`,
                { npcName: npcName.trim(), systemId },
                { withCredentials: true }
            );
            if (data.success) {
                setNpcName("");
                await loadSheets();
                setView({ type: "edit", sheet: data.sheet });
            }
        } catch {
            /* ignore */
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (sheetId: string) => {
        setDeleting(sheetId);
        try {
            const { data } = await axios.delete(`${API}/games/${gameId}/npc-sheets/${sheetId}`, { withCredentials: true });
            if (data.success) {
                setSheets((prev) => prev.filter((s) => s._id !== sheetId));
            }
        } catch {
            /* ignore */
        } finally {
            setDeleting(null);
        }
    };

    const handleSaveSheet = async (sheetId: string, values: Record<string, unknown>) => {
        const { data } = await axios.put(
            `${API}/games/${gameId}/npc-sheets/${sheetId}`,
            { values },
            { withCredentials: true }
        );
        if (data.success) {
            setSheets((prev) => prev.map((s) => (s._id === sheetId ? { ...s, values: data.sheet.values } : s)));
        }
    };

    const handleSaveNpcName = async (sheetId: string, name: string) => {
        const { data } = await axios.put(
            `${API}/games/${gameId}/npc-sheets/${sheetId}`,
            { npcName: name },
            { withCredentials: true }
        );
        if (data.success) {
            setSheets((prev) => prev.map((s) => (s._id === sheetId ? { ...s, npcName: data.sheet.npcName } : s)));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {view.type !== "list" && (
                            <button
                                onClick={() => { setView({ type: "list" }); setNpcName(""); }}
                                className="p-1 hover:bg-muted rounded transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        {view.type === "list" && "Personnages non joueurs"}
                        {view.type === "create" && "Nouveau PNJ"}
                        {view.type === "edit" && `Fiche — ${view.sheet.npcName}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
                    ) : view.type === "list" ? (
                        <ListView
                            sheets={sheets}
                            deleting={deleting}
                            onEdit={(sheet) => setView({ type: "edit", sheet })}
                            onDelete={handleDelete}
                            onCreate={() => setView({ type: "create" })}
                        />
                    ) : view.type === "create" ? (
                        <CreateView
                            npcName={npcName}
                            creating={creating}
                            onNameChange={setNpcName}
                            onCreate={handleCreate}
                        />
                    ) : (
                        <EditView
                            sheet={view.sheet}
                            template={template}
                            systemId={systemId}
                            onSave={handleSaveSheet}
                            onSaveNpcName={handleSaveNpcName}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── List view ──

function ListView({
    sheets,
    deleting,
    onEdit,
    onDelete,
    onCreate,
}: {
    sheets: NpcSheet[];
    deleting: string | null;
    onEdit: (sheet: NpcSheet) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            {sheets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun PNJ pour le moment.
                </p>
            ) : (
                sheets.map((sheet) => (
                    <div
                        key={sheet._id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                        <span className="text-sm font-medium">{sheet.npcName}</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onEdit(sheet)}
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title="Modifier"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => onDelete(sheet._id)}
                                disabled={deleting === sheet._id}
                                className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={onCreate}>
                <Plus size={14} className="mr-1.5" />
                Nouveau PNJ
            </Button>
        </div>
    );
}

// ── Create view ──

function CreateView({
    npcName,
    creating,
    onNameChange,
    onCreate,
}: {
    npcName: string;
    creating: boolean;
    onNameChange: (v: string) => void;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Nom du PNJ</label>
                <Input
                    value={npcName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Ex : Inspecteur Moreau"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && onCreate()}
                />
            </div>
            <Button onClick={onCreate} disabled={!npcName.trim() || creating} size="sm">
                {creating ? "Création..." : "Créer et éditer la fiche"}
            </Button>
        </div>
    );
}

// ── Edit view ──

function EditView({
    sheet,
    template,
    systemId,
    onSave,
    onSaveNpcName,
}: {
    sheet: NpcSheet;
    template: Template | null;
    systemId: string | null;
    onSave: (sheetId: string, values: Record<string, unknown>) => Promise<void>;
    onSaveNpcName: (sheetId: string, name: string) => Promise<void>;
}) {
    const [editName, setEditName] = useState(sheet.npcName);
    const [savingName, setSavingName] = useState(false);

    const handleNameBlur = async () => {
        if (editName.trim() && editName !== sheet.npcName) {
            setSavingName(true);
            try { await onSaveNpcName(sheet._id, editName.trim()); }
            finally { setSavingName(false); }
        }
    };

    if (!template || !systemId) {
        return <p className="text-sm text-muted-foreground text-center py-8">Template introuvable.</p>;
    }

    // Build instance object compatible with MagnusArchivesSheet
    const instance = {
        _id: sheet._id,
        systemId: sheet.systemId,
        values: sheet.values,
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
                <label className="text-xs font-medium text-muted-foreground shrink-0">Nom PNJ</label>
                <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleNameBlur}
                    className="h-8 text-sm"
                    disabled={savingName}
                />
            </div>

            {systemId === "magnus_archives" ? (
                <MagnusArchivesSheet
                    template={template}
                    instance={instance}
                    isEditable={true}
                    onSave={(values) => onSave(sheet._id, values)}
                />
            ) : (
                <p className="text-sm text-muted-foreground">Système non supporté : {systemId}</p>
            )}
        </div>
    );
}
