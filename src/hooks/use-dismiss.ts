import { useEffect, type RefObject } from "react";

// Ferme un popover ouvert au clic en dehors de `ref` ou sur Échap.
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [ref, open, onDismiss]);
}
