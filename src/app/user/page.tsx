"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { ProfileForm } from "@/components/game/create-game-form";
import { CurrentGamesCards } from "@/components/game/current-games-cards";
import { JoinGameDialog } from "@/components/game/join-game-dialog";

export default function UserPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(k => k + 1);

    return (
        <>
            <Navbar />
            <main className="min-h-svh bg-muted">
                <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Mes parties</h2>
                            <div className="flex gap-2">
                                <ProfileForm onCreated={refresh} />
                                <JoinGameDialog onJoined={refresh} />
                            </div>
                        </div>
                        <CurrentGamesCards key={refreshKey} />
                    </section>
                </div>
            </main>
        </>
    );
}
