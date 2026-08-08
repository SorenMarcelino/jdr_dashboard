"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
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
import { API_URL, resetAuthState } from "@/lib/api"
import { createLoginSchema, type LoginValues } from "@/lib/validation/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState("")
  const t = useTranslations("auth.login")
  const tErrors = useTranslations("auth.errors")

  const loginSchema = useMemo(() => createLoginSchema(tErrors), [tErrors])

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    setError("")
    try {
      const { data } = await axios.post(
        `${API_URL}/auth/login`,
        values,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      )

      if (data.success) {
        resetAuthState()
        router.push("/user")
      } else {
        setError(data.message || t("genericError"))
      }
    } catch {
      setError(t("genericError"))
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("password")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
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

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? t("submitting") : t("submit")}
                </Button>

                <div className="text-center text-sm">
                  {t("noAccount")}{" "}
                  <a href="/signup" className="underline underline-offset-4">
                    {t("signupLink")}
                  </a>
                </div>
              </div>
            </form>
          </Form>
          <div className="relative hidden bg-gradient-to-br from-primary/20 via-muted to-primary/5 md:block" />
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        {t.rich("termsNotice", {
          terms: (chunks) => <a href="#">{chunks}</a>,
          privacy: (chunks) => <a href="#">{chunks}</a>,
        })}
      </div>
    </div>
  )
}
