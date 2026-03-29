"use client";

import { use } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/navbar";
import { ScenarioList } from "@/components/scenario/ScenarioList";

const API = "http://localhost:5050";

export default function ScenarioListPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    const router = useRouter();

    useEffect(() => {
        axios
            .post(`${API}/auth/verify`, {}, { withCredentials: true })
            .catch(() => router.push("/login"));
    }, [router]);

    return (
        <div className="flex flex-col min-h-svh bg-muted">
            <Navbar />
            <main className="flex-1 py-4">
                <ScenarioList gameId={gameId} />
            </main>
        </div>
    );
}
