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
import React, { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { useTranslations } from "next-intl"
import { API_URL } from "@/lib/api"
import { createSignupSchema, type SignupValues } from "@/lib/validation/auth"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const t = useTranslations("auth.signup")
    const tErrors = useTranslations("auth.errors")

    const signupSchema = useMemo(() => createSignupSchema(tErrors), [tErrors])

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
                setSuccess(t("successMessage"))
                setTimeout(() => router.push("/user"), 1500)
            } else {
                setError(data.message || t("genericError"))
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || t("genericError"))
            } else {
                setError(t("genericError"))
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
                                    <h1 className="text-2xl font-bold">{t("title")}</h1>
                                    <p className="text-balance text-muted-foreground">
                                        {t("subtitle")}
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("email")}</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder={t("emailPlaceholder")} autoComplete="email" {...field} />
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
                                            <FormLabel>{t("username")}</FormLabel>
                                            <FormControl>
                                                <Input type="text" placeholder={t("usernamePlaceholder")} autoComplete="username" {...field} />
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
                                            <FormLabel>{t("password")}</FormLabel>
                                            <FormControl>
                                                <Input type="password" autoComplete="new-password" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                {t("passwordHint")}
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
                                            <FormLabel>{t("confirmPassword")}</FormLabel>
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
                                    {form.formState.isSubmitting ? t("submitting") : t("submit")}
                                </Button>

                                <div className="text-center text-sm">
                                    {t("hasAccount")}{" "}
                                    <a href="/login" className="underline underline-offset-4">
                                        {t("loginLink")}
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
