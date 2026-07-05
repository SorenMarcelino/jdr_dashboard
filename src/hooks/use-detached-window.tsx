"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Copie dans la popup toutes les feuilles de style du document parent
// (Tailwind est injecté en <style>/<link> par Next). Même origine → pas de
// restriction d'accès, et la popup hérite de la CSP de l'app.
function copyStyles(source: Document, target: Document) {
    source
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((node) => {
            target.head.appendChild(node.cloneNode(true));
        });
}

// Propage le thème du parent : classe `dark` (next-themes) + data-game-theme
// posés sur <html>, et les classes utilitaires du <body>.
function copyTheme(source: Document, target: Document) {
    target.documentElement.className = source.documentElement.className;
    const gameTheme = source.documentElement.getAttribute("data-game-theme");
    if (gameTheme) target.documentElement.setAttribute("data-game-theme", gameTheme);
    const colorScheme = source.documentElement.style.colorScheme;
    if (colorScheme) target.documentElement.style.colorScheme = colorScheme;
    target.body.className = source.body.className;
}

type Props = {
    children: ReactNode;
    title: string;
    width?: number;
    height?: number;
    /** Appelé quand la fenêtre est fermée (par l'utilisateur ou bloquée). */
    onClose?: () => void;
};

// Rend `children` dans une vraie fenêtre navigateur via window.open +
// createPortal : React reste réconcilié depuis la fenêtre parente (contexts,
// sockets et état continuent de fonctionner), aucun script n'est injecté
// dans la popup (compatible CSP nonce). À l'unmount, la popup est fermée.
export function DetachedWindowPortal({
    children,
    title,
    width = 520,
    height = 640,
    onClose,
}: Props) {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    // Ref pour que la fermeture tardive appelle toujours le dernier callback.
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const popup = window.open(
            "",
            "_blank",
            `width=${width},height=${height},popup=yes`
        );
        if (!popup) {
            // Popup bloquée par le navigateur → on re-docke immédiatement.
            onCloseRef.current?.();
            return;
        }

        popup.document.title = title;
        copyStyles(document, popup.document);
        copyTheme(document, popup.document);

        popup.document.body.style.margin = "0";
        const mount = popup.document.createElement("div");
        mount.style.height = "100vh";
        popup.document.body.appendChild(mount);
        setContainer(mount);

        // Détection de fermeture : pagehide couvre la fermeture normale, le
        // poller couvre les cas où l'event ne se déclenche pas (ex : fermé
        // pendant que l'onglet parent est en arrière-plan).
        const handlePageHide = () => onCloseRef.current?.();
        popup.addEventListener("pagehide", handlePageHide);
        const closePoller = window.setInterval(() => {
            if (popup.closed) {
                window.clearInterval(closePoller);
                onCloseRef.current?.();
            }
        }, 500);

        return () => {
            window.clearInterval(closePoller);
            popup.removeEventListener("pagehide", handlePageHide);
            setContainer(null);
            popup.close();
        };
    }, [title, width, height]);

    if (!container) return null;
    return createPortal(children, container);
}
