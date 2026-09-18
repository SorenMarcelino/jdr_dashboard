"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { GameStats } from "@/types/stats";
import { EXPORT_FORMATS, downloadStats, type ExportFormatId } from "@/lib/statsExport";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FORMAT_IDS = Object.keys(EXPORT_FORMATS) as ExportFormatId[];

export function ExportMenu({ stats }: { stats: GameStats }) {
    const t = useTranslations("game.stats.export");
    const tBreakdown = useTranslations("game.stats.breakdown");
    const locale = useLocale();

    const exportAs = (formatId: ExportFormatId) =>
        downloadStats(formatId, { stats, t: tBreakdown, locale, now: new Date() });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    {t("button")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {FORMAT_IDS.map((id) => (
                    <DropdownMenuItem key={id} onSelect={() => exportAs(id)}>
                        {t(id)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
