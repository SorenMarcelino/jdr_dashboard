"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";
import { addSavedColor, removeSavedColor } from "@/lib/colors";

const ENDPOINT = `${API_URL}/api/profile/saved-colors`;
const EMPTY: string[] = [];

// Store partagé par toutes les palettes de la page : une seule requête GET,
// et un ajout dans une palette apparaît aussitôt dans les autres. La
// déconnexion recharge la page (navbar), ce qui vide le store.
let colors: string[] = EMPTY;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setColors(next: string[]) {
    colors = next;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function load() {
    if (!loadPromise) {
        loadPromise = axios
            .get<{ colors: string[] }>(ENDPOINT)
            .then((res) => setColors(res.data.colors))
            // Échec : on réessaiera au prochain montage d'une palette.
            .catch(() => {
                loadPromise = null;
            });
    }
    return loadPromise;
}

// Mise à jour optimiste, annulée si le serveur refuse.
async function save(next: string[]) {
    const previous = colors;
    setColors(next);
    try {
        const res = await axios.put<{ colors: string[] }>(ENDPOINT, { colors: next });
        setColors(res.data.colors);
    } catch {
        setColors(previous);
    }
}

export function useSavedColors() {
    const current = useSyncExternalStore(subscribe, () => colors, () => EMPTY);

    useEffect(() => {
        void load();
    }, []);

    const addColor = useCallback((color: string) => {
        const next = addSavedColor(colors, color);
        if (next !== colors) void save(next);
    }, []);

    const removeColor = useCallback((color: string) => {
        void save(removeSavedColor(colors, color));
    }, []);

    return { colors: current, addColor, removeColor };
}
