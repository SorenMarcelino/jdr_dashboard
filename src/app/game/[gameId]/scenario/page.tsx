"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar, type NavbarGame } from "@/components/navbar";
import { ScenarioList } from "@/components/scenario/ScenarioList";
import { API_URL } from "@/lib/api";

const API = API_URL;

export default function ScenarioListPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
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
        <div className="flex flex-col min-h-svh bg-muted">
            <Navbar game={game ?? undefined} />
            <main className="flex-1 py-4">
                <ScenarioList gameId={gameId} />
            </main>
        </div>
    );
}
