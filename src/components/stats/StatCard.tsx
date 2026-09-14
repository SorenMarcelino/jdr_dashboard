"use client";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="bg-background rounded-lg border p-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xl font-bold tabular-nums">{value}</span>
            {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
    );
}

// Durée lisible à partir de millisecondes : "3 j 4 h", "2 h 15 min", "45 min".
export function formatDuration(ms: number, labels: { d: string; h: string; min: string }): string {
    const totalMinutes = Math.round(ms / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days} ${labels.d} ${hours} ${labels.h}`;
    if (hours > 0) return `${hours} ${labels.h} ${minutes} ${labels.min}`;
    return `${minutes} ${labels.min}`;
}
