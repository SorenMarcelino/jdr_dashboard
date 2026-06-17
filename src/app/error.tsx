"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Trace côté client (remonterait vers un service d'observabilité en prod)
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
            <span className="text-4xl">⚠️</span>
            <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
            <p className="text-muted-foreground">
                Quelque chose s&apos;est mal passé. Vous pouvez réessayer.
            </p>
            <Button onClick={reset}>Réessayer</Button>
        </div>
    );
}
