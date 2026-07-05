"use client";

import { useEffect, useState } from "react";

type Props = {
    url: string;
    title: string;
};

// Attributs du custom element <model-viewer> utilisés ici.
type ModelViewerAttributes = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
> & {
    src?: string;
    alt?: string;
    "camera-controls"?: boolean;
    "auto-rotate"?: boolean;
};

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "model-viewer": ModelViewerAttributes;
        }
    }
}

// Visionneuse 3D (GLB/GLTF par URL) basée sur @google/model-viewer, importé
// dynamiquement côté client (le module enregistre le custom element).
// camera-controls : chaque joueur orbite/zoome localement, sans sync caméra.
// NB : l'hôte externe du modèle doit servir des en-têtes CORS (model-viewer
// charge le binaire via fetch).
export function ModelRenderer({ url, title }: Props) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        import("@google/model-viewer").then(() => {
            if (!cancelled) setReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!ready) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                Chargement de la visionneuse 3D...
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-muted">
            <model-viewer
                src={url}
                alt={title || "Modèle 3D diffusé"}
                camera-controls
                auto-rotate
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}
