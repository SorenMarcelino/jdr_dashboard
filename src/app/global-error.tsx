"use client";

import { useEffect } from "react";

// Boundary de dernier recours : remplace le layout racine si celui-ci échoue.
// Doit définir ses propres <html> / <body>.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="fr">
            <body style={{ fontFamily: "system-ui, sans-serif" }}>
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem",
                        textAlign: "center",
                        padding: "1.5rem",
                    }}
                >
                    <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                        Une erreur critique est survenue
                    </h1>
                    <p style={{ color: "#666" }}>L&apos;application a rencontré un problème inattendu.</p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                        }}
                    >
                        Réessayer
                    </button>
                </div>
            </body>
        </html>
    );
}
