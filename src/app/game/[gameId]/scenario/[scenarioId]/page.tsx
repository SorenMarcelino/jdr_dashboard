"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar, type NavbarGame } from "@/components/navbar";
import { ScenarioWorkspace } from "@/components/scenario/ScenarioWorkspace";
import { API_URL } from "@/lib/api";

const API = API_URL;

export default function ScenarioPage({
    params,
}: {
    params: Promise<{ gameId: string; scenarioId: string }>;
}) {
    const { gameId, scenarioId } = use(params);
    const router = useRouter();
    const [game, setGame] = useState<NavbarGame | null>(null);

    useEffect(() => {
        axios
            .get(`${API}/games/${gameId}`, { withCredentials: true })
            .then((res) => {
                if (res.data.success && res.data.game) setGame(res.data.game);
            })
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push("/login");
                }
            });
    }, [gameId, router]);

    return (
        <div className="flex flex-col h-svh bg-muted">
            <Navbar game={game ?? undefined} />
            <ScenarioWorkspace gameId={gameId} scenarioId={scenarioId} />
        </div>
    );
}
