"use client";

import { GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
    title: string;
    children: React.ReactNode;
    className?: string;
    headerRight?: React.ReactNode;
};

export function BentoWidget({ title, children, className, headerRight }: Props) {
    return (
        <div className={cn("h-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden", className)}>
            {/* Drag handle */}
            <div className="drag-handle shrink-0 flex items-center justify-between px-3 py-2 border-b bg-muted/40 cursor-grab active:cursor-grabbing select-none">
                <div className="flex items-center gap-2">
                    <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                </div>
                {headerRight && <div className="flex items-center gap-1">{headerRight}</div>}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto min-h-0">
                {children}
            </div>
        </div>
    );
}
