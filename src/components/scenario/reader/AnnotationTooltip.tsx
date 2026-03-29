"use client";

type Props = {
    text: string;
    x: number;
    y: number;
};

export function AnnotationTooltip({ text, x, y }: Props) {
    return (
        <div
            className="fixed z-50 max-w-xs px-3 py-2 text-xs bg-popover text-popover-foreground border rounded-lg shadow-lg pointer-events-none"
            style={{
                left: `${x}px`,
                top: `${y - 8}px`,
                transform: "translate(-50%, -100%)",
            }}
        >
            {text}
            <div
                className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border"
            />
        </div>
    );
}
