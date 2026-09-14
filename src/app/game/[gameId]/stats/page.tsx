"use client";

import { use } from "react";
import { StatsWorkspace } from "@/components/stats/StatsWorkspace";

export default function StatsPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    return <StatsWorkspace gameId={gameId} />;
}
