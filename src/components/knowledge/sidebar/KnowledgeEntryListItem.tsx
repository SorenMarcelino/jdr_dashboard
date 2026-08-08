"use client";

import { FileText, Trash2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    title: string;
    visibleToPlayers: boolean;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
};

export function KnowledgeEntryListItem({ title, visibleToPlayers, isActive, onClick, onDelete }: Props) {
    const t = useTranslations("knowledge.sidebar");

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
            <span className="flex-1 min-w-0 truncate">{title}</span>
            <span title={visibleToPlayers ? t("visibleBadge") : t("hiddenBadge")}>
                {visibleToPlayers ? (
                    <Eye size={12} className="shrink-0 text-primary" />
                ) : (
                    <EyeOff size={12} className="shrink-0 text-muted-foreground/50" />
                )}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                title={t("deleteTitle")}
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
