"use client";

import { use } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/navbar";
import { ScenarioWorkspace } from "@/components/scenario/ScenarioWorkspace";

const API = "http://localhost:5050";

export default function ScenarioPage({
    params,
}: {
    params: Promise<{ gameId: string; scenarioId: string }>;
}) {
    const { gameId, scenarioId } = use(params);
    const router = useRouter();

    useEffect(() => {
        axios
            .post(`${API}/auth/verify`, {}, { withCredentials: true })
            .catch(() => router.push("/login"));
    }, [router]);

    return (
        <div className="flex flex-col h-svh bg-muted">
            <Navbar />
            <ScenarioWorkspace gameId={gameId} scenarioId={scenarioId} />
        </div>
    );
}
