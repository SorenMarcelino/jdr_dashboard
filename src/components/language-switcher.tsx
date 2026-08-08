"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const LOCALES = ["fr", "en"] as const;

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();

    const setLocale = (next: string) => {
        document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
        router.refresh();
    };

    return (
        <div className="flex items-center gap-1">
            {LOCALES.map((l) => (
                <Button
                    key={l}
                    variant={locale === l ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2 text-xs uppercase"
                    onClick={() => setLocale(l)}
                >
                    {l}
                </Button>
            ))}
        </div>
    );
}
