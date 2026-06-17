"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import axios from "axios";
import { ModeToggle } from '@/components/dark-mode-toggle/mode-toggle';
import { Button } from '@/components/ui/button';
import { getGameLogo, getNavbarLogoAsset } from '@/config/gameLogos';
import { API_URL } from "@/lib/api";

/** Infos minimales du jeu en cours nécessaires à la navbar. */
export type NavbarGame = {
    name: string;
    characterSheet: string;
};

export function Navbar({ game }: { game?: NavbarGame }) {
    const router = useRouter();
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await axios.post(
                    `${API_URL}/auth/verify`,
                    {},
                    { withCredentials: true }
                );
                if (data.status) {
                    setUsername(data.user.username);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
        } catch {
            // ignore
        }
        router.push("/login");
    };

    // Logo du jeu en cours, ou logo générique hors partie.
    const logo = getGameLogo(game?.characterSheet);
    const logoAsset = getNavbarLogoAsset(logo);

    return (
        <nav className="flex items-center justify-between border-b p-4">
            {/* Logo à gauche : jeu en cours ou générique (le wordmark est dans l'image) */}
            <Link href="/" className="flex items-center" title={game?.name ?? logo.label}>
                <Image
                    src={logoAsset.src}
                    alt={game?.name ?? logo.label}
                    width={logoAsset.width}
                    height={logoAsset.height}
                    priority
                    className="h-10 w-auto max-w-[200px] object-contain object-left"
                />
            </Link>

            {/* Boutons à droite */}
            <div className="flex items-center gap-3">
                {username ? (
                    <>
                        <span className="text-sm text-muted-foreground">Hello {username}</span>
                        <Button size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </>
                ) : (
                    <Button asChild size="sm">
                        <Link href="/login">Log In</Link>
                    </Button>
                )}

                <ModeToggle />
            </div>
        </nav>
    );
}
