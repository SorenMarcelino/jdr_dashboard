"use client";

import { useId } from "react";
import { Lock, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { RecipientSelectProps } from "@/themes/types";

/** Destinataire des messages et des jets : tout le monde, ou un membre en privé. */
export function RecipientSelect({ members, value, onChange, disabled }: RecipientSelectProps) {
    const t = useTranslations("chat");
    const selectId = useId();
    const isPrivate = !!value;
    const Icon = isPrivate ? Lock : Users;

    return (
        <div
            className={cn(
                "flex items-center gap-1.5 border-t px-3 py-1 text-xs transition-colors",
                isPrivate ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <label htmlFor={selectId}>{t("recipientLabel")}</label>
            <select
                id={selectId}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || undefined)}
                disabled={disabled}
                className="min-w-0 flex-1 cursor-pointer bg-transparent py-0.5 font-medium outline-none disabled:opacity-40"
            >
                <option value="">{t("everyone")}</option>
                {members.map((m) => (
                    <option key={m._id} value={m._id}>
                        {m.isGm ? t("gmSuffix", { username: m.username }) : m.username}
                    </option>
                ))}
            </select>
        </div>
    );
}
