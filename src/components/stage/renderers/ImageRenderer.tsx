"use client";

import { useTranslations } from "next-intl";

type Props = {
    url: string;
    title: string;
};

export function ImageRenderer({ url, title }: Props) {
    const t = useTranslations("stage");

    return (
        <div className="h-full w-full flex items-center justify-center bg-muted">
            {/* Média externe arbitraire : next/image ne convient pas (hôtes non déclarés) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={title || t("mediaAlt")}
                className="max-h-full max-w-full object-contain"
            />
        </div>
    );
}
