"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PageSummary = {
    _id: string;
    title: string;
    order: number;
    tags: string[];
};

export type ScenarioData = {
    _id: string;
    title: string;
    description: string;
    entryPageId: string | null;
    currentPageId: string | null;
    gameId: string;
};

type ScenarioContextType = {
    scenario: ScenarioData | null;
    setScenario: (s: ScenarioData | null) => void;
    pages: PageSummary[];
    setPages: (p: PageSummary[]) => void;
    currentPageId: string | null;
    navigateToPage: (pageId: string) => void;
    mode: "edit" | "read";
    setMode: (m: "edit" | "read") => void;
    addPage: (page: PageSummary) => void;
    removePage: (pageId: string) => void;
    updatePageTitle: (pageId: string, title: string) => void;
};

const ScenarioContext = createContext<ScenarioContextType | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
    const [scenario, setScenario] = useState<ScenarioData | null>(null);
    const [pages, setPages] = useState<PageSummary[]>([]);
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [mode, setMode] = useState<"edit" | "read">("edit");

    const navigateToPage = useCallback((pageId: string) => {
        setCurrentPageId(pageId);
    }, []);

    const addPage = useCallback((page: PageSummary) => {
        setPages((prev) => [...prev, page]);
    }, []);

    const removePage = useCallback((pageId: string) => {
        setPages((prev) => prev.filter((p) => p._id !== pageId));
        setCurrentPageId((prev) => (prev === pageId ? null : prev));
    }, []);

    const updatePageTitle = useCallback((pageId: string, title: string) => {
        setPages((prev) => prev.map((p) => (p._id === pageId ? { ...p, title } : p)));
    }, []);

    return (
        <ScenarioContext.Provider
            value={{
                scenario,
                setScenario,
                pages,
                setPages,
                currentPageId,
                navigateToPage,
                mode,
                setMode,
                addPage,
                removePage,
                updatePageTitle,
            }}
        >
            {children}
        </ScenarioContext.Provider>
    );
}

export function useScenario() {
    const ctx = useContext(ScenarioContext);
    if (!ctx) throw new Error("useScenario must be used within ScenarioProvider");
    return ctx;
}
