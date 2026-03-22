"use client"

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await axios.post(
                "http://localhost:5050/games/join",
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
                setError(err.response?.data?.message || "Erreur lors de la connexion.");
            } else {
                setError("Erreur lors de la connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Rejoindre une partie</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Rejoindre une partie</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="inviteCode">Code d&apos;invitation</Label>
                        <Input
                            id="inviteCode"
                            placeholder="Ex: AB12CD"
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
                        {loading ? "Connexion..." : "Rejoindre"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
