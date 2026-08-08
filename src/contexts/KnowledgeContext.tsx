// src/contexts/KnowledgeContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type KnowledgeEntrySummary = {
    _id: string;
    title: string;
    category: string;
    visibleToPlayers: boolean;
    order: number;
};

type KnowledgeContextType = {
    entries: KnowledgeEntrySummary[];
    setEntries: (e: KnowledgeEntrySummary[]) => void;
    currentEntryId: string | null;
    selectEntry: (id: string | null) => void;
    addEntry: (entry: KnowledgeEntrySummary) => void;
    removeEntry: (id: string) => void;
    updateEntryMeta: (id: string, patch: Partial<KnowledgeEntrySummary>) => void;
};

const KnowledgeContext = createContext<KnowledgeContextType | null>(null);

export function KnowledgeProvider({ children }: { children: ReactNode }) {
    const [entries, setEntries] = useState<KnowledgeEntrySummary[]>([]);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

    const selectEntry = useCallback((id: string | null) => setCurrentEntryId(id), []);

    const addEntry = useCallback((entry: KnowledgeEntrySummary) => {
        setEntries((prev) => [...prev, entry]);
    }, []);

    const removeEntry = useCallback((id: string) => {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        setCurrentEntryId((prev) => (prev === id ? null : prev));
    }, []);

    const updateEntryMeta = useCallback((id: string, patch: Partial<KnowledgeEntrySummary>) => {
        setEntries((prev) => prev.map((e) => (e._id === id ? { ...e, ...patch } : e)));
    }, []);

    return (
        <KnowledgeContext.Provider
            value={{ entries, setEntries, currentEntryId, selectEntry, addEntry, removeEntry, updateEntryMeta }}
        >
            {children}
        </KnowledgeContext.Provider>
    );
}

export function useKnowledge() {
    const ctx = useContext(KnowledgeContext);
    if (!ctx) throw new Error("useKnowledge must be used within KnowledgeProvider");
    return ctx;
}
