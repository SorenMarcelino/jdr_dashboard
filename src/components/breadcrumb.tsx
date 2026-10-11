"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Niveau du fil d'Ariane. `label` absent = encore en chargement. */
export type BreadcrumbItem = {
    label?: string;
    href?: string;
};

/**
 * Fil d'Ariane affiché sous la navbar. Le dernier niveau sans lien est la
 * page courante. Sur mobile, seuls la racine et le dernier niveau restent
 * visibles, les intermédiaires se replient en « … ».
 *
 * Les univers de jeu l'habillent dans leur theme.css via les classes
 * `app-breadcrumb`, `app-breadcrumb__sep` et `app-breadcrumb__current`.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
    const t = useTranslations("breadcrumb");
    const last = items.length - 1;

    const separator = (
        <span aria-hidden="true" className="app-breadcrumb__sep flex items-center">
            <ChevronRight className="h-3.5 w-3.5" />
        </span>
    );

    return (
        <nav
            aria-label={t("ariaLabel")}
            className="app-breadcrumb shrink-0 border-b bg-background px-4 py-2 text-sm text-muted-foreground"
        >
            <ol className="flex min-w-0 items-center gap-1.5">
                {items.map((item, i) => {
                    const isCurrent = i === last;
                    const isMiddle = i > 0 && i < last;

                    return (
                        <li
                            key={i}
                            className={cn(
                                "flex min-w-0 items-center gap-1.5",
                                isMiddle && "hidden sm:flex",
                                i === 0 && "shrink-0"
                            )}
                        >
                            {i > 0 && separator}
                            {item.label === undefined ? (
                                <Skeleton className="h-4 w-24" />
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="app-breadcrumb__link max-w-[16rem] truncate transition-colors hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    aria-current={isCurrent ? "page" : undefined}
                                    className={cn("truncate", isCurrent && "app-breadcrumb__current font-medium text-foreground")}
                                >
                                    {item.label}
                                </span>
                            )}
                            {/* Repli mobile des niveaux intermédiaires */}
                            {i === 0 && items.length > 2 && (
                                <span aria-hidden="true" className="flex items-center gap-1.5 sm:hidden">
                                    {separator}
                                    …
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
