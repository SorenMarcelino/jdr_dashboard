"use client"

import { useState } from "react";
import axios from "axios";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function JoinGameDialog({ onJoined }: { onJoined?: () => void }) {
    const [open, setOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const t = useTranslations("game.join");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${API_URL}/games/join`,
                { inviteCode },
                { withCredentials: true }
            );
            if (data.success) {
                setOpen(false);
                setInviteCode("");
                onJoined?.();
            } else {
                setError(data.message);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || t("genericError"));
            } else {
                setError(t("genericError"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">{t("title")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="inviteCode">{t("codeLabel")}</Label>
                        <Input
                            id="inviteCode"
                            placeholder={t("codePlaceholder")}
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t("submitting") : t("submit")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
