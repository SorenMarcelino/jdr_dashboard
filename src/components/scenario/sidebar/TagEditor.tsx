"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    tags: string[];
    onChange: (tags: string[]) => void;
};

export function TagEditor({ tags, onChange }: Props) {
    const [draft, setDraft] = useState("");
    const t = useTranslations("scenario.sidebar");

    const addTag = () => {
        const value = draft.trim();
        if (!value || tags.includes(value)) {
            setDraft("");
            return;
        }
        onChange([...tags, value]);
        setDraft("");
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                        title={t("removeTag")}
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={t("addTagPlaceholder")}
                className="w-20 px-2 py-0.5 text-xs bg-transparent border border-dashed rounded-full focus:outline-none focus:border-primary"
            />
        </div>
    );
}
