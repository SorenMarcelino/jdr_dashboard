"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {cn} from "@/lib/utils";

export function ModeToggle({ collapsed }: { collapsed?: boolean }) {
    const { theme, setTheme } = useTheme()

    const toggleTheme= () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className={cn(
                "justify-center m-2",
                collapsed && "h-8 w-8 p-0"
            )}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            {!collapsed && <span className="sr-only">Toggle theme</span>}
        </Button>
    )
}
