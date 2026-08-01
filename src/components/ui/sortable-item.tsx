"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type Props = {
    id: string;
    children: ReactNode;
};

export function SortableItem({ id, children }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-1">
            <button
                {...attributes}
                {...listeners}
                type="button"
                className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                title="Glisser pour réordonner"
            >
                <GripVertical size={14} />
            </button>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
