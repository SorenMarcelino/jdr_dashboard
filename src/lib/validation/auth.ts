import { z } from "zod";

type Translator = (key: string) => string;

function createPasswordSchema(t: Translator) {
    return z
        .string()
        .min(8, t("passwordMinLength"))
        .regex(/[A-Z]/, t("passwordUppercase"))
        .regex(/[a-z]/, t("passwordLowercase"))
        .regex(/\d/, t("passwordDigit"))
        .regex(/[!@#$%^&*(),.?":{}|<>]/, t("passwordSpecial"));
}

export function createLoginSchema(t: Translator) {
    return z.object({
        email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
        password: z.string().min(1, t("passwordRequired")),
    });
}
export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createSignupSchema(t: Translator) {
    return z
        .object({
            email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
            username: z.string().trim().min(1, t("usernameRequired")).max(50),
            password: createPasswordSchema(t),
            confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("passwordMismatch"),
            path: ["confirmPassword"],
        });
}
export type SignupValues = z.infer<ReturnType<typeof createSignupSchema>>;
