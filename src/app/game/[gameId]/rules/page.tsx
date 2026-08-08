"use client";

import { use } from "react";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";

export default function RulesPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    return <KnowledgeWorkspace gameId={gameId} type="rule" />;
}
