"use client"

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import { ModeToggle } from '@/components/dark-mode-toggle/mode-toggle';
import {ThemeProvider} from "@/components/dark-mode-toggle/theme-provider";
import {useCookies} from "react-cookie";
import {useRouter} from "next/navigation";
import axios from "axios";

export function Navbar() {
    const [, removeCookie] = useCookies(['token']);
    const router = useRouter();
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await axios.post(
                    "http://localhost:5050/auth/verify",
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
            await axios.post("http://localhost:5050/auth/logout", {}, { withCredentials: true });
        } catch {
            // ignore
        }
        removeCookie("token", { path: "/" });
        router.push("/login");
    };

    return (
        <nav className="flex items-center justify-between p-4 border-b">
            {/* Logo à gauche */}
            <div className="text-xl font-bold">
                <Link href="/">
                    LOGO
                </Link>
            </div>

            {/* Boutons à droite */}
            <div className="flex items-center gap-4">
                {username ? (
                    <>
                        <span className="text-sm">Hello {username}</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 reounded-md hover:bg-blue-600 transition-colors"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Log In
                    </Link>
                )}

                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ModeToggle/>
                </ThemeProvider>
            </div>
        </nav>
    );
}
