"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";

type Game = {
    _id: string;
    name: string;
    description: string;
    characterSheet: string;
    thumbnail: string;
    inviteCode: string;
    createdBy: { username: string };
};

export function CurrentGamesCards() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const { data } = await axios.get("http://localhost:5050/games/", {
                    withCredentials: true,
                });
                if (data.success) {
                    setGames(data.games);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des parties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    if (loading) {
        return <p className="text-muted-foreground text-sm">Chargement des parties...</p>;
    }

    if (games.length === 0) {
        return <p className="text-muted-foreground text-sm">Aucune partie en cours.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {games.map((game) => (
                <Card key={game._id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-32 bg-muted flex items-center justify-center">
                        {game.thumbnail ? (
                            <img
                                src={game.thumbnail}
                                alt={game.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-4xl">🎲</span>
                        )}
                    </div>
                    <CardContent className="p-4 space-y-1">
                        <h3 className="font-semibold truncate">{game.name}</h3>
                        {game.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{game.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">MJ : {game.createdBy?.username}</p>
                        <p className="text-xs font-mono text-muted-foreground">Code : {game.inviteCode}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
