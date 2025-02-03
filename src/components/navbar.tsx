import React from 'react';
import Link from 'next/link';
import { ModeToggle } from '@/components/dark-mode-toggle/mode-toggle';
import {ThemeProvider} from "@/components/dark-mode-toggle/theme-provider";

export function Navbar() {
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
                <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Log In
                </Link>
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
