"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Navbar } from '@/components/navbar';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        axios.post("http://localhost:5050/auth/verify", {}, { withCredentials: true })
            .then(({ data }) => {
                if (data.status) router.replace("/user");
            })
            .catch(() => {});
    }, [router]);

    return (
        <>
            <Navbar />
            <div className="min-h-svh flex flex-col items-center justify-center gap-4 text-center p-6">
                <h1 className="text-3xl font-bold">Bienvenue sur votre jeu de rôle en ligne</h1>
                <p className="text-muted-foreground">Connectez-vous pour commencer à jouer</p>
            </div>
        </>
    );
}
