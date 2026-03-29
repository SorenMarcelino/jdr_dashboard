"use client";

import { FileText, Trash2 } from "lucide-react";

type Props = {
    title: string;
    isActive: boolean;
    isEntry: boolean;
    onClick: () => void;
    onDelete: () => void;
};

export function PageListItem({ title, isActive, isEntry, onClick, onDelete }: Props) {
    return (
        <div
            className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm ${
                isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
            }`}
            onClick={onClick}
        >
            <FileText size={14} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{title}</span>
            {isEntry && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                    Entrée
                </span>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                title="Supprimer"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
