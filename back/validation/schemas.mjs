import { z } from "zod";

// Objet libre (données de jeu : valeurs de fiche, contenu TipTap, etc.)
const freeObject = z.record(z.any());

// ── Auth ────────────────────────────────────────────────────────────────
export const signupSchema = z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().trim().min(1, "Username is required").max(50),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

// ── Profil ──────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
    username: z.string().trim().min(1, "Username is required").max(50),
});

// ── Parties ─────────────────────────────────────────────────────────────
// La miniature est envoyée par le front sous forme de data URL base64
// (FileReader.readAsDataURL), donc potentiellement volumineuse. On autorise
// ~5 Mo (≈ image de 3,7 Mo après inflation base64), bien sous la limite de
// 16 Mo d'un document MongoDB.
const THUMBNAIL_MAX = 5_000_000;

export const createGameSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    characterSheet: z.string().trim().min(1, "Character sheet is required"),
    description: z.string().max(2000).optional(),
    thumbnail: z.string().max(THUMBNAIL_MAX).optional(),
});

export const joinGameSchema = z.object({
    inviteCode: z.string().trim().min(4).max(12),
});

// ── Scénarios ───────────────────────────────────────────────────────────
export const createScenarioSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional(),
});

export const updateScenarioSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    currentPageId: z.string().nullable().optional(),
    entryPageId: z.string().nullable().optional(),
});

export const createPageSchema = z.object({
    title: z.string().trim().max(200).optional(),
    tags: z.array(z.string().max(50)).optional(),
});

export const updatePageSchema = z.object({
    title: z.string().trim().max(200).optional(),
    content: z.any().optional(),
    tags: z.array(z.string().max(50)).optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    order: z.number().optional(),
});

export const updatePositionsSchema = z.object({
    positions: z.array(
        z.object({
            pageId: z.string(),
            position: z.object({ x: z.number(), y: z.number() }),
        })
    ),
});

// ── Fiches personnage ───────────────────────────────────────────────────
export const createSheetSchema = z.object({
    systemId: z.string().trim().min(1, "systemId is required"),
    values: freeObject.optional(),
    // Optionnel : le MJ peut créer la fiche d'un joueur de sa partie.
    playerId: z.string().optional(),
});

export const updateSheetSchema = z.object({
    values: freeObject,
});

export const createNpcSheetSchema = z.object({
    npcName: z.string().trim().min(1, "Le nom du PNJ est requis.").max(120),
    systemId: z.string().trim().min(1).optional(),
    values: freeObject.optional(),
});

export const updateNpcSheetSchema = z.object({
    npcName: z.string().trim().min(1).max(120).optional(),
    values: freeObject.optional(),
});
