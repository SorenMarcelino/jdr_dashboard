import { z } from "zod";

// Politique de mot de passe alignée sur le backend (validatePassword) :
// 8 caractères min., au moins une majuscule, une minuscule, un chiffre et un
// caractère spécial.
const passwordSchema = z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/\d/, "Au moins un chiffre")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Au moins un caractère spécial");

export const loginSchema = z.object({
    email: z.string().min(1, "Email requis").email("Format d'email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
    .object({
        email: z.string().min(1, "Email requis").email("Format d'email invalide"),
        username: z.string().trim().min(1, "Nom d'utilisateur requis").max(50),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
    });
export type SignupValues = z.infer<typeof signupSchema>;
