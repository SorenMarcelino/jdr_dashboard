"use client";

type Props = {
    url: string;
    title: string;
};

export function ImageRenderer({ url, title }: Props) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-muted">
            {/* Média externe arbitraire : next/image ne convient pas (hôtes non déclarés) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={title || "Média diffusé"}
                className="max-h-full max-w-full object-contain"
            />
        </div>
    );
}
