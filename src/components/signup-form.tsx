"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import axios from "axios"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [inputValue, setInputValue] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    })
    const { email, username, password, confirmPassword } = inputValue

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setInputValue({ ...inputValue, [name]: value })
    }

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }

        try {
            const { data } = await axios.post(
                "http://localhost:5050/auth/signup",
                { email, username, password },
                { withCredentials: true }
            )

            if (data.success) {
                setSuccess("Compte créé avec succès ! Redirection...")
                setTimeout(() => router.push("/user"), 1500)
            } else {
                setError(data.message || "Erreur lors de la création du compte.")
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Erreur lors de la création du compte.")
            } else {
                setError("Erreur lors de la création du compte.")
            }
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Créer un compte</h1>
                                <p className="text-balance text-muted-foreground">
                                    Rejoins l&apos;aventure
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    name="username"
                                    placeholder="Aragorn"
                                    value={username}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={handleOnChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    8 caractères min. avec majuscule, chiffre et caractère spécial.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="rounded-md bg-green-500/15 px-4 py-3 text-sm text-green-700">
                                    {success}
                                </div>
                            )}

                            <Button type="submit" className="w-full">
                                Créer mon compte
                            </Button>

                            <div className="text-center text-sm">
                                Déjà un compte ?{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    Se connecter
                                </a>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/placeholder.svg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
