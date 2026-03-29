"use client";

import { useState } from "react";

type Props = {
    onConfirm: (previewText: string) => void;
    onClose: () => void;
};

export function AnnotationPopover({ onConfirm, onClose }: Props) {
    const [text, setText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onConfirm(text.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="bg-background border rounded-lg shadow-lg w-80 p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-sm font-semibold mb-2">Ajouter une note</h3>
                <p className="text-xs text-muted-foreground mb-3">
                    Ce texte apparaîtra au survol en mode lecture.
                </p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Texte d'aperçu..."
                    className="w-full border rounded p-2 text-sm bg-background resize-none"
                    rows={3}
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        Ajouter
                    </button>
                </div>
            </form>
        </div>
    );
}
