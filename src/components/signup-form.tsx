"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { API_URL } from "@/lib/api"
import { signupSchema, type SignupValues } from "@/lib/validation/auth"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
    })

    const onSubmit = async (values: SignupValues) => {
        setError("")
        setSuccess("")
        try {
            const { data } = await axios.post(
                `${API_URL}/auth/signup`,
                { email: values.email, username: values.username, password: values.password },
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
                    <Form {...form}>
                        <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">Créer un compte</h1>
                                    <p className="text-balance text-muted-foreground">
                                        Rejoins l&apos;aventure
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="m@example.com" autoComplete="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom d&apos;utilisateur</FormLabel>
                                            <FormControl>
                                                <Input type="text" placeholder="Aragorn" autoComplete="username" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" autoComplete="new-password" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                8 caractères min. avec majuscule, minuscule, chiffre et caractère spécial.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmer le mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" autoComplete="new-password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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

                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Création..." : "Créer mon compte"}
                                </Button>

                                <div className="text-center text-sm">
                                    Déjà un compte ?{" "}
                                    <a href="/login" className="underline underline-offset-4">
                                        Se connecter
                                    </a>
                                </div>
                            </div>
                        </form>
                    </Form>
                    <div className="relative hidden bg-gradient-to-br from-primary/20 via-muted to-primary/5 md:block" />
                </CardContent>
            </Card>
        </div>
    )
}
