"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

type ScenarioNodeData = {
    title: string;
    tags: string[];
    isCurrent: boolean;
    isEntry: boolean;
};

function ScenarioNodeComponent({ data }: NodeProps) {
    const { title, tags, isCurrent, isEntry } = data as unknown as ScenarioNodeData;

    return (
        <div
            className={`px-4 py-3 rounded-lg border shadow-sm min-w-[120px] max-w-[200px] transition-colors ${
                isCurrent
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : isEntry
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-background"
            }`}
        >
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground" />

            <div className="text-xs font-semibold truncate">{title}</div>

            {tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {isEntry && (
                <div className="text-[9px] text-primary font-medium mt-1">Point d&apos;entrée</div>
            )}

            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground" />
        </div>
    );
}

export const ScenarioNode = memo(ScenarioNodeComponent);
