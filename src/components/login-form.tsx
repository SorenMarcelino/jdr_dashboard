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
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { API_URL } from "@/lib/api"
import { loginSchema, type LoginValues } from "@/lib/validation/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState("")

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
        router.push("/user")
      } else {
        setError(data.message || "Email ou mot de passe incorrect")
      }
    } catch {
      setError("Email ou mot de passe incorrect")
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
                  <h1 className="text-2xl font-bold">Bon retour</h1>
                  <p className="text-balance text-muted-foreground">
                    Connectez-vous à votre compte JDR Dashboard
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
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
                  {form.formState.isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>

                <div className="text-center text-sm">
                  Pas encore de compte ?{" "}
                  <a href="/signup" className="underline underline-offset-4">
                    S&apos;inscrire
                  </a>
                </div>
              </div>
            </form>
          </Form>
          <div className="relative hidden bg-gradient-to-br from-primary/20 via-muted to-primary/5 md:block" />
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        En continuant, vous acceptez nos <a href="#">conditions d&apos;utilisation</a>{" "}
        et notre <a href="#">politique de confidentialité</a>.
      </div>
    </div>
  )
}
