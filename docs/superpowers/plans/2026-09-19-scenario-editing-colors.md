# Rédaction des scénarios : palette, surlignage, section MJ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à l'éditeur de scénario une palette de couleurs réutilisable avec couleurs sauvegardées par utilisateur, le surlignage multicolore, et une section « MJ uniquement » personnalisable (couleur, emoji, libellé).

**Architecture:** Un module pur `src/lib/colors.ts` et un composant `<ColorPalette>` indépendant de TipTap, alimentés par un store module-level (`useSavedColors`) synchronisé avec `GET/PUT /api/profile/saved-colors`. Le surlignage est une extension `Highlight` dont seul le rendu est surchargé. Le bloc `gmOnlyBlock` gagne trois attributs nullable et une React NodeView partagée par l'éditeur et le lecteur.

**Tech Stack:** Next 15 / React 19, TipTap 3.29, Tailwind 3.4, next-intl, Express + Mongoose, Zod 3, `node --test` (type stripping pour le TS pur).

**Spec:** `docs/superpowers/specs/2026-09-19-scenario-editing-colors-design.md`

## Global Constraints

- Couleurs stockées en hex minuscule `#rrggbb` ; `#rgb` accepté en entrée et étendu.
- 24 couleurs sauvegardées au maximum par utilisateur.
- Attributs `gmOnlyBlock` : `color`, `emoji`, `label`, tous `null` par défaut ; `null` = rendu actuel. Aucune migration de données.
- Libellé MJ : 40 caractères (code points) max ; emoji : un seul graphème.
- Surlignage affiché en `color-mix(in srgb, <hex> 35%, transparent)`.
- Toute couleur lue depuis le contenu passe par `normalizeHex` avant d'aller dans un `style` (pas d'injection CSS).
- Les modules testés par `node --test` (`src/lib/colors.ts`, `gmOnlyAttrs.ts`) n'ont **aucun import runtime** (seuls les `import type` sont permis : Node ne résout ni l'alias `@/` ni les imports TS sans extension).
- Textes UI via next-intl, dans `messages/fr.json` **et** `messages/en.json`.
- Notion (base `collection://182127d4-78e1-8192-b289-000b8602fcd7`, propriété `Status`) : DOING au début d'un ticket, TEST quand il est vérifié. **Jamais DONE.**
- **Branche :** `feat/scenario-editing`, créée depuis `main`.
- **Commits :** un commit par tâche (autorisé par Soren), avec des `git add` à chemins explicites — jamais `git add -A` / `git add .`. Messages en français, format `type(scope): …`, terminés par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Jamais** de commit ni de push des fichiers sous `docs/superpowers/` (spec et plan restent locaux, non suivis). Aucun `git push`.

Tickets Notion :

| Ticket | Page ID |
|---|---|
| Epic « Améliorations de la rédaction des scénarios » | `3bd127d4-78e1-8098-a0a1-dcea81ab532e` |
| « Ajout de la palette de couleurs pour le texte » | `3bd127d4-78e1-803d-9740-d2eea261784e` |
| « Permettre de surligner le texte » | `3bd127d4-78e1-80fd-b335-c02498a59e25` |
| « Pouvoir personnaliser la section “MJ uniquement” » | `3bd127d4-78e1-806c-aa99-f552605af5fd` |

## File Structure

| Fichier | Rôle |
|---|---|
| `back/models/UserModel.mjs` (mod) | champ `savedColors` |
| `back/validation/schemas.mjs` (mod) | `savedColorsSchema` |
| `back/services/userService.mjs` (mod) | `normalizeSavedColors`, `getSavedColors`, `setSavedColors` |
| `back/routes/api.mjs` (mod) | `GET/PUT /profile/saved-colors` (monté sous `/api`) |
| `back/tests/unit/schemas.test.mjs` (mod) | tests du schéma |
| `back/tests/unit/userService.test.mjs` (new) | tests de `normalizeSavedColors` |
| `src/lib/colors.ts` (new) | couleurs par défaut, `normalizeHex`, `addSavedColor`, `removeSavedColor`, `highlightBackground` |
| `src/lib/colors.test.mjs` (new) | tests du module |
| `package.json` (mod) | `test:unit` découvre aussi les tests de `src/` |
| `src/hooks/use-saved-colors.ts` (new) | store partagé des couleurs sauvegardées |
| `src/hooks/use-dismiss.ts` (new) | fermeture de popover (clic extérieur, Échap) |
| `src/components/ui/ColorPalette.tsx` (new) | composant palette |
| `src/components/scenario/editor/ScenarioToolbar.tsx` (mod) | palette texte + surlignage |
| `src/components/scenario/editor/extensions/ScenarioHighlight.ts` (new) | surlignage multicolore |
| `src/components/scenario/editor/extensions/gmOnlyAttrs.ts` (new) | helpers purs du bloc MJ |
| `src/components/scenario/editor/extensions/gmOnlyAttrs.test.mjs` (new) | tests des helpers |
| `src/components/scenario/editor/extensions/GmOnlyBlock.ts` (mod) | attributs + NodeView |
| `src/components/scenario/editor/extensions/GmOnlyBlockView.tsx` (new) | pastille + popover |
| `src/components/scenario/editor/ScenarioEditor.tsx` (mod) | enregistre `ScenarioHighlight` |
| `src/components/scenario/reader/ScenarioReader.tsx` (mod) | enregistre `ScenarioHighlight` |
| `src/app/globals.css` (mod) | styles du bloc MJ via `--gm-color` |
| `messages/fr.json`, `messages/en.json` (mod) | nouvelles clés |

---

### Task 1: Backend — couleurs sauvegardées par utilisateur

**Files:**
- Modify: `back/models/UserModel.mjs`
- Modify: `back/validation/schemas.mjs`
- Modify: `back/services/userService.mjs`
- Modify: `back/routes/api.mjs`
- Test: `back/tests/unit/schemas.test.mjs`, `back/tests/unit/userService.test.mjs`

**Interfaces:**
- Produces: `GET /api/profile/saved-colors` → `{ success: true, colors: string[] }` ; `PUT /api/profile/saved-colors` body `{ colors: string[] }` → `{ success: true, colors: string[] }` (normalisées) ; 400 `{ success: false, message: "Validation error", errors }` si invalide.

- [ ] **Step 1: Passer l'epic et le ticket palette en DOING dans Notion**

Avec `notion-update-page` (`command: "update_properties"`, `properties: { "Status": "DOING" }`) sur `3bd127d4-78e1-8098-a0a1-dcea81ab532e` puis `3bd127d4-78e1-803d-9740-d2eea261784e`.

- [ ] **Step 2: Écrire les tests du schéma**

Dans `back/tests/unit/schemas.test.mjs`, ajouter `savedColorsSchema` à l'import depuis `../../validation/schemas.mjs`, puis en fin de fichier :

```js
test("savedColorsSchema accepts #rgb and #rrggbb in any case", () => {
    assert.equal(savedColorsSchema.safeParse({ colors: ["#abc", "#A1B2C3"] }).success, true);
});

test("savedColorsSchema accepts an empty list", () => {
    assert.equal(savedColorsSchema.safeParse({ colors: [] }).success, true);
});

test("savedColorsSchema rejects non-hex values", () => {
    for (const bad of ["red", "#12", "#1234", "#ggg000", "rgb(0,0,0)", "#abc;color:red"]) {
        assert.equal(savedColorsSchema.safeParse({ colors: [bad] }).success, false, bad);
    }
});

test("savedColorsSchema rejects more than 24 colors", () => {
    const colors = Array.from({ length: 25 }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    assert.equal(savedColorsSchema.safeParse({ colors }).success, false);
});

test("savedColorsSchema rejects a missing colors field", () => {
    assert.equal(savedColorsSchema.safeParse({}).success, false);
});
```

- [ ] **Step 3: Écrire les tests de normalisation**

Créer `back/tests/unit/userService.test.mjs` :

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSavedColors } from "../../services/userService.mjs";

test("normalizeSavedColors lowercases and expands short hex", () => {
    assert.deepEqual(normalizeSavedColors(["#ABC", "#A1B2C3"]), ["#aabbcc", "#a1b2c3"]);
});

test("normalizeSavedColors keeps the first occurrence of duplicates", () => {
    assert.deepEqual(normalizeSavedColors(["#fff", "#123456", "#FFFFFF"]), ["#ffffff", "#123456"]);
});

test("normalizeSavedColors drops invalid values", () => {
    assert.deepEqual(normalizeSavedColors(["#123456", "nope", 42]), ["#123456"]);
});

test("normalizeSavedColors caps the list at 24 colors", () => {
    const colors = Array.from({ length: 30 }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    const result = normalizeSavedColors(colors);
    assert.equal(result.length, 24);
    assert.equal(result[0], "#000000");
});
```

- [ ] **Step 4: Vérifier que les tests échouent**

Run: `npm run test:unit`
Expected: FAIL — `savedColorsSchema` et `normalizeSavedColors` ne sont pas exportés (`SyntaxError: The requested module ... does not provide an export named ...`).

- [ ] **Step 5: Ajouter le schéma**

Dans `back/validation/schemas.mjs`, en fin de fichier :

```js
// ── Couleurs sauvegardées (palette de l'éditeur) ────────────────────────
// La normalisation (minuscules, #rgb → #rrggbb, doublons) est faite par le
// service ; le schéma ne vérifie que la forme.
const hexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");

export const savedColorsSchema = z.object({
    colors: z.array(hexColor).max(24),
});
```

- [ ] **Step 6: Ajouter le champ au modèle**

Dans `back/models/UserModel.mjs`, après le champ `refreshToken` :

```js
    savedColors: {
        type: [String],
        default: [],
    },
```

- [ ] **Step 7: Ajouter les fonctions de service**

Dans `back/services/userService.mjs`, en fin de fichier :

```js
export const MAX_SAVED_COLORS = 24;

/**
 * Normalise les couleurs de la palette : minuscules, #rgb → #rrggbb,
 * valeurs invalides ignorées, doublons retirés (la première occurrence
 * gagne), 24 au plus.
 */
export const normalizeSavedColors = (colors) => {
    const unique = new Set();
    for (const raw of colors) {
        let hex = String(raw).trim().toLowerCase();
        if (/^#[0-9a-f]{3}$/.test(hex)) {
            hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
        }
        if (/^#[0-9a-f]{6}$/.test(hex)) unique.add(hex);
    }
    return [...unique].slice(0, MAX_SAVED_COLORS);
};

/**
 * Couleurs sauvegardées de l'utilisateur
 */
export const getSavedColors = async (userId) => {
    const user = await User.findById(userId).select('savedColors');

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return [...user.savedColors];
};

/**
 * Remplace les couleurs sauvegardées de l'utilisateur
 */
export const setSavedColors = async (userId, colors) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { savedColors: normalizeSavedColors(colors) },
        { new: true, runValidators: true }
    ).select('savedColors');

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return [...user.savedColors];
};
```

- [ ] **Step 8: Ajouter les routes**

Dans `back/routes/api.mjs`, étendre les imports :

```js
import { getAllUsers, searchUsers, updateUserProfile, getSavedColors, setSavedColors } from "../services/userService.mjs";
import { updateProfileSchema, savedColorsSchema } from "../validation/schemas.mjs";
```

puis, juste après la route `PUT /profile` :

```js
// Couleurs sauvegardées de la palette de l'éditeur
router.get("/profile/saved-colors", requireAuth, asyncHandler(async (req, res) => {
    const colors = await getSavedColors(req.user._id);
    return res.status(200).json({ success: true, colors });
}));

// Remplace la liste entière (normalisée par le service)
router.put("/profile/saved-colors", requireAuth, validate(savedColorsSchema), asyncHandler(async (req, res) => {
    const colors = await setSavedColors(req.user._id, req.body.colors);
    return res.status(200).json({ success: true, colors });
}));
```

- [ ] **Step 9: Vérifier que les tests passent**

Run: `npm run test:unit`
Expected: PASS, y compris les tests existants.

- [ ] **Step 10: Vérifier les routes en conditions réelles**

Invoquer le skill projet `verify` (recette backend Express + Mongo) et, connecté avec un compte de test :
- `GET /api/profile/saved-colors` → `200 { success: true, colors: [] }` ;
- `PUT /api/profile/saved-colors` avec `{ "colors": ["#ABC", "#abc", "#123456"] }` → `200 { colors: ["#aabbcc", "#123456"] }` ;
- `GET` à nouveau → même liste ;
- `PUT` avec `{ "colors": ["red"] }` → `400`, `message: "Validation error"` ;
- `GET` sans cookie → `401`.

- [ ] **Step 11: Commit**

```bash
git add back/models/UserModel.mjs back/validation/schemas.mjs back/services/userService.mjs back/routes/api.mjs back/tests/unit/schemas.test.mjs back/tests/unit/userService.test.mjs
git commit -m "feat(user): couleurs sauvegardées de la palette (GET/PUT /api/profile/saved-colors)"
```

---

### Task 2: Module pur `src/lib/colors.ts`

**Files:**
- Create: `src/lib/colors.ts`
- Modify: `package.json` (script `test:unit`)
- Test: `src/lib/colors.test.mjs`

**Interfaces:**
- Produces :
  - `type PaletteColor = { key: string; value: string }`
  - `DEFAULT_COLORS: PaletteColor[]` (les 7 couleurs historiques, « Défaut » étant géré par `<ColorPalette>` ; `key` = clé i18n sous `common.colorPalette`)
  - `MAX_SAVED_COLORS = 24`
  - `normalizeHex(value: unknown): string | null`
  - `addSavedColor(list: string[], color: string): string[]` (renvoie `list` inchangée — même référence — si rien à ajouter)
  - `removeSavedColor(list: string[], color: string): string[]`
  - `highlightBackground(hex: string): string`

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/colors.test.mjs` :

```js
import { test } from "node:test";
import assert from "node:assert/strict";
// Node exécute directement le TypeScript (type stripping).
import {
    DEFAULT_COLORS,
    MAX_SAVED_COLORS,
    addSavedColor,
    highlightBackground,
    normalizeHex,
    removeSavedColor,
} from "./colors.ts";

test("normalizeHex lowercases and expands short hex", () => {
    assert.equal(normalizeHex("#ABC"), "#aabbcc");
    assert.equal(normalizeHex(" #A1B2C3 "), "#a1b2c3");
});

test("normalizeHex rejects anything that is not a hex color", () => {
    for (const bad of ["red", "#12", "#1234", "#ggg000", "", null, undefined, 42, "#abc;color:red"]) {
        assert.equal(normalizeHex(bad), null, String(bad));
    }
});

test("DEFAULT_COLORS keeps the 7 historical colors, normalized", () => {
    assert.deepEqual(
        DEFAULT_COLORS.map((c) => c.value),
        ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"],
    );
    for (const c of DEFAULT_COLORS) assert.equal(normalizeHex(c.value), c.value);
});

test("addSavedColor puts the new color first and dedupes", () => {
    assert.deepEqual(addSavedColor(["#111111", "#222222"], "#222222"), ["#222222", "#111111"]);
    assert.deepEqual(addSavedColor(["#111111"], "#ABC"), ["#aabbcc", "#111111"]);
});

test("addSavedColor ignores invalid colors and default colors", () => {
    const list = ["#111111"];
    assert.equal(addSavedColor(list, "nope"), list);
    assert.equal(addSavedColor(list, "#EF4444"), list);
});

test("addSavedColor caps the list", () => {
    const list = Array.from({ length: MAX_SAVED_COLORS }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    const result = addSavedColor(list, "#ffffff");
    assert.equal(result.length, MAX_SAVED_COLORS);
    assert.equal(result[0], "#ffffff");
    assert.equal(result.includes(list[MAX_SAVED_COLORS - 1]), false);
});

test("removeSavedColor removes a color whatever its case", () => {
    assert.deepEqual(removeSavedColor(["#aabbcc", "#111111"], "#ABC"), ["#111111"]);
});

test("highlightBackground mixes the color with transparency", () => {
    assert.equal(highlightBackground("#aabbcc"), "color-mix(in srgb, #aabbcc 35%, transparent)");
});
```

- [ ] **Step 2: Faire découvrir les tests de `src/` à `test:unit`**

Sur `main`, le script ne lance que `back/tests/unit/`. Dans `package.json`, remplacer la ligne du script par exactement (même ligne que sur `feat/stats-export`, pour que les deux branches fusionnent sans conflit) :

```json
    "test:unit": "node --test \"back/tests/unit/*.test.mjs\" \"src/**/*.test.mjs\"",
```

- [ ] **Step 2b: Vérifier que les tests échouent**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '.../src/lib/colors.ts'` (les tests backend existants, eux, passent toujours).

- [ ] **Step 3: Implémenter le module**

Créer `src/lib/colors.ts` :

```ts
// Couleurs de l'éditeur de scénario (texte, surlignage, bloc MJ).
// Module pur, sans import runtime : testé directement par `node --test`.

export type PaletteColor = { key: string; value: string };

// Couleurs proposées par défaut. `key` est la clé i18n du nom de la couleur
// dans le namespace `common.colorPalette`.
export const DEFAULT_COLORS: PaletteColor[] = [
    { key: "red", value: "#ef4444" },
    { key: "orange", value: "#f97316" },
    { key: "yellow", value: "#eab308" },
    { key: "green", value: "#22c55e" },
    { key: "blue", value: "#3b82f6" },
    { key: "purple", value: "#a855f7" },
    { key: "pink", value: "#ec4899" },
];

export const MAX_SAVED_COLORS = 24;

const SHORT_HEX = /^#([0-9a-f]{3})$/;
const LONG_HEX = /^#[0-9a-f]{6}$/;

// Hex `#rrggbb` minuscule, ou null pour toute autre valeur. Toute couleur
// venant du contenu passe par ici avant d'atterrir dans un attribut `style`.
export function normalizeHex(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const hex = value.trim().toLowerCase();
    const short = SHORT_HEX.exec(hex);
    if (short) return "#" + [...short[1]].map((c) => c + c).join("");
    return LONG_HEX.test(hex) ? hex : null;
}

// Ajoute une couleur en tête de liste. Renvoie la même liste si la couleur
// est invalide ou fait déjà partie des couleurs par défaut.
export function addSavedColor(list: string[], color: string): string[] {
    const hex = normalizeHex(color);
    if (!hex || DEFAULT_COLORS.some((c) => c.value === hex)) return list;
    return [hex, ...list.filter((c) => c !== hex)].slice(0, MAX_SAVED_COLORS);
}

export function removeSavedColor(list: string[], color: string): string[] {
    const hex = normalizeHex(color);
    return list.filter((c) => c !== hex);
}

// Fond de surlignage semi-transparent, lisible en thème clair comme sombre.
export function highlightBackground(hex: string): string {
    return `color-mix(in srgb, ${hex} 35%, transparent)`;
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json src/lib/colors.ts src/lib/colors.test.mjs
git commit -m "feat(editor): module de couleurs partagé (normalisation, couleurs sauvegardées)"
```

---

### Task 3: Composant `<ColorPalette>` et couleur du texte

**Files:**
- Create: `src/hooks/use-saved-colors.ts`
- Create: `src/hooks/use-dismiss.ts`
- Create: `src/components/ui/ColorPalette.tsx`
- Modify: `src/components/scenario/editor/ScenarioToolbar.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `DEFAULT_COLORS`, `normalizeHex`, `addSavedColor`, `removeSavedColor` (Task 2) ; routes de la Task 1.
- Produces :
  - `useSavedColors(): { colors: string[]; addColor(color: string): void; removeColor(color: string): void }`
  - `useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void): void`
  - `<ColorPalette value={string | null} onChange={(color: string | null) => void} />`
  - Dans `ScenarioToolbar` : état `openPopover: "textColor" | "highlight" | null` et le conteneur `popoverRef` (utilisés par la Task 4).

- [ ] **Step 1: Ajouter les clés i18n**

Dans `messages/fr.json`, ajouter sous `common` :

```json
"colorPalette": {
    "default": "Défaut",
    "add": "Ajouter une couleur",
    "remove": "Retirer {color}",
    "red": "Rouge",
    "orange": "Orange",
    "yellow": "Jaune",
    "green": "Vert",
    "blue": "Bleu",
    "purple": "Violet",
    "pink": "Rose"
}
```

Dans `messages/en.json`, sous `common` :

```json
"colorPalette": {
    "default": "Default",
    "add": "Add a color",
    "remove": "Remove {color}",
    "red": "Red",
    "orange": "Orange",
    "yellow": "Yellow",
    "green": "Green",
    "blue": "Blue",
    "purple": "Purple",
    "pink": "Pink"
}
```

Puis supprimer de `scenario.toolbar`, dans les deux fichiers, les clés devenues inutiles : `colorDefault`, `colorRed`, `colorOrange`, `colorYellow`, `colorGreen`, `colorBlue`, `colorPurple`, `colorPink`. Vérifier qu'elles ne sont utilisées nulle part ailleurs :

Run: `grep -rn "colorDefault\|colorRed\|colorPink" src`
Expected: seules des occurrences dans `ScenarioToolbar.tsx` (qui disparaissent au Step 5).

- [ ] **Step 2: Créer `use-dismiss.ts`**

```ts
import { useEffect, type RefObject } from "react";

// Ferme un popover ouvert au clic en dehors de `ref` ou sur Échap.
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [ref, open, onDismiss]);
}
```

- [ ] **Step 3: Créer `use-saved-colors.ts`**

```ts
"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";
import { addSavedColor, removeSavedColor } from "@/lib/colors";

const ENDPOINT = `${API_URL}/api/profile/saved-colors`;
const EMPTY: string[] = [];

// Store partagé par toutes les palettes de la page : une seule requête GET,
// et un ajout dans une palette apparaît aussitôt dans les autres. La
// déconnexion recharge la page (navbar), ce qui vide le store.
let colors: string[] = EMPTY;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setColors(next: string[]) {
    colors = next;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function load() {
    if (!loadPromise) {
        loadPromise = axios
            .get<{ colors: string[] }>(ENDPOINT)
            .then((res) => setColors(res.data.colors))
            // Échec : on réessaiera au prochain montage d'une palette.
            .catch(() => {
                loadPromise = null;
            });
    }
    return loadPromise;
}

// Mise à jour optimiste, annulée si le serveur refuse.
async function save(next: string[]) {
    const previous = colors;
    setColors(next);
    try {
        const res = await axios.put<{ colors: string[] }>(ENDPOINT, { colors: next });
        setColors(res.data.colors);
    } catch {
        setColors(previous);
    }
}

export function useSavedColors() {
    const current = useSyncExternalStore(subscribe, () => colors, () => EMPTY);

    useEffect(() => {
        void load();
    }, []);

    const addColor = useCallback((color: string) => {
        const next = addSavedColor(colors, color);
        if (next !== colors) void save(next);
    }, []);

    const removeColor = useCallback((color: string) => {
        void save(removeSavedColor(colors, color));
    }, []);

    return { colors: current, addColor, removeColor };
}
```

- [ ] **Step 4: Créer `ColorPalette.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Ban, Plus, X } from "lucide-react";
import { DEFAULT_COLORS, normalizeHex } from "@/lib/colors";
import { useSavedColors } from "@/hooks/use-saved-colors";

type Props = {
    value: string | null;
    onChange: (color: string | null) => void;
};

function Swatch({
    color,
    title,
    selected,
    onSelect,
}: {
    color: string | null;
    title: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={selected}
            // preventDefault : garde la sélection de l'éditeur
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSelect}
            className={`flex h-5 w-5 items-center justify-center rounded-full border border-border ${
                selected ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
            }`}
            style={{ backgroundColor: color ?? "transparent" }}
        >
            {color === null && <Ban size={12} className="text-muted-foreground" />}
        </button>
    );
}

// Palette réutilisable : couleurs par défaut, couleurs sauvegardées de
// l'utilisateur, et « + » pour en choisir une nouvelle (qui est sauvegardée).
export function ColorPalette({ value, onChange }: Props) {
    const t = useTranslations("common.colorPalette");
    const { colors: saved, addColor, removeColor } = useSavedColors();
    const inputRef = useRef<HTMLInputElement>(null);
    const current = normalizeHex(value);

    // Événement natif `change` (et non `input`, que React expose en onChange) :
    // il ne part qu'une fois, à la fermeture du sélecteur du système.
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        const onCommit = () => {
            const hex = normalizeHex(input.value);
            if (!hex) return;
            addColor(hex);
            onChange(hex);
        };
        input.addEventListener("change", onCommit);
        return () => input.removeEventListener("change", onCommit);
    }, [addColor, onChange]);

    return (
        <div className="flex w-[196px] flex-col gap-2">
            <div className="flex flex-wrap gap-1">
                <Swatch color={null} title={t("default")} selected={current === null} onSelect={() => onChange(null)} />
                {DEFAULT_COLORS.map((c) => (
                    <Swatch
                        key={c.key}
                        color={c.value}
                        title={t(c.key)}
                        selected={current === c.value}
                        onSelect={() => onChange(c.value)}
                    />
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {saved.map((hex) => (
                    <div key={hex} className="group relative">
                        <Swatch color={hex} title={hex} selected={current === hex} onSelect={() => onChange(hex)} />
                        <button
                            type="button"
                            title={t("remove", { color: hex })}
                            aria-label={t("remove", { color: hex })}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => removeColor(hex)}
                            className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full border bg-background group-hover:flex"
                        >
                            <X size={8} />
                        </button>
                    </div>
                ))}
                <label
                    title={t("add")}
                    className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-dashed border-border hover:bg-muted"
                >
                    <Plus size={12} />
                    <input
                        ref={inputRef}
                        type="color"
                        aria-label={t("add")}
                        defaultValue={current ?? "#888888"}
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />
                </label>
            </div>
        </div>
    );
}
```

- [ ] **Step 5: Brancher la palette sur la couleur du texte dans `ScenarioToolbar.tsx`**

1. Supprimer la constante `TEXT_COLOR_KEYS`.
2. Imports : remplacer `import { useEffect, useState } from "react";` par
   ```ts
   import { useCallback, useEffect, useRef, useState } from "react";
   ```
   et ajouter
   ```ts
   import { ColorPalette } from "@/components/ui/ColorPalette";
   import { useDismiss } from "@/hooks/use-dismiss";
   ```
3. Remplacer `const [colorPickerOpen, setColorPickerOpen] = useState(false);` par :
   ```ts
   const [openPopover, setOpenPopover] = useState<"textColor" | "highlight" | null>(null);
   const popoverRef = useRef<HTMLDivElement>(null);
   const closePopover = useCallback(() => setOpenPopover(null), []);
   useDismiss(popoverRef, openPopover !== null, closePopover);
   ```
   (avant le `if (!editor) return null;` — règle des hooks).
4. Remplacer tout le bloc `{/* Couleur de texte */} <div className="relative">…</div>` par :
   ```tsx
   {/* Couleur du texte */}
   <div ref={popoverRef} className="flex items-center gap-0.5">
       <div className="relative">
           <ToolbarButton
               onClick={() => setOpenPopover((v) => (v === "textColor" ? null : "textColor"))}
               isActive={!!editor.getAttributes("textStyle").color}
               title={t("textColor")}
           >
               <Palette size={iconSize} />
           </ToolbarButton>
           {openPopover === "textColor" && (
               <div className="absolute left-0 top-full z-10 mt-1 rounded-md border bg-background p-2 shadow-md">
                   <ColorPalette
                       value={editor.getAttributes("textStyle").color ?? null}
                       onChange={(color) => {
                           if (color) editor.chain().focus().setColor(color).run();
                           else editor.chain().focus().unsetColor().run();
                           setOpenPopover(null);
                       }}
                   />
               </div>
           )}
       </div>
   </div>
   ```

- [ ] **Step 6: Typecheck et lint**

Run: `npm run typecheck && npm run lint`
Expected: aucune erreur.

- [ ] **Step 7: Vérifier dans le navigateur**

Lancer l'app (skill `run`), ouvrir un scénario en édition :
- sélectionner du texte → Palette → les 7 couleurs + « Défaut » ; cliquer Bleu colore le texte et ferme le popover ;
- « + » → choisir une couleur → texte coloré, la couleur apparaît dans la ligne des sauvegardées ;
- recharger la page → la couleur sauvegardée est toujours là ; × la retire ;
- clic hors du popover ou Échap → le popover se ferme ;
- « Défaut » retire la couleur.

- [ ] **Step 8: Passer le ticket palette en TEST dans Notion**

`notion-update-page` sur `3bd127d4-78e1-803d-9740-d2eea261784e`, `properties: { "Status": "TEST" }`.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/use-saved-colors.ts src/hooks/use-dismiss.ts src/components/ui/ColorPalette.tsx src/components/scenario/editor/ScenarioToolbar.tsx messages/fr.json messages/en.json
git commit -m "feat(editor): palette de couleurs réutilisable avec couleurs sauvegardées"
```

---

### Task 4: Surlignage multicolore

**Files:**
- Modify: `package.json`, `package-lock.json` (dépendance)
- Create: `src/components/scenario/editor/extensions/ScenarioHighlight.ts`
- Modify: `src/components/scenario/editor/ScenarioEditor.tsx`
- Modify: `src/components/scenario/reader/ScenarioReader.tsx`
- Modify: `src/components/scenario/editor/ScenarioToolbar.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `normalizeHex`, `highlightBackground` (Task 2) ; `<ColorPalette>`, `openPopover`, `popoverRef` (Task 3).
- Produces: `ScenarioHighlight` (extension TipTap, nom de marque `highlight`, commandes `setHighlight({ color })`, `unsetHighlight()`).

- [ ] **Step 1: Passer le ticket surlignage en DOING dans Notion**

`notion-update-page` sur `3bd127d4-78e1-80fd-b335-c02498a59e25`, `properties: { "Status": "DOING" }`.

- [ ] **Step 2: Installer l'extension à la version de TipTap installée**

Run: `node -p 'require("./node_modules/@tiptap/core/package.json").version'` (attendu : `3.29.2`), puis
`npm install @tiptap/extension-highlight@3.29.2`
Expected: `package.json` contient `"@tiptap/extension-highlight": "^3.29.2"`.

- [ ] **Step 3: Créer `ScenarioHighlight.ts`**

```ts
import Highlight from "@tiptap/extension-highlight";
import { highlightBackground, normalizeHex } from "@/lib/colors";

// Surlignage multicolore. La couleur est stockée en hex pur (data-color) mais
// affichée en semi-transparence, pour rester lisible en thème clair et sombre.
export const ScenarioHighlight = Highlight.extend({
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element) => normalizeHex(element.getAttribute("data-color")),
                renderHTML: (attributes) => {
                    const color = normalizeHex(attributes.color);
                    if (!color) return {};
                    return {
                        "data-color": color,
                        style: `background-color: ${highlightBackground(color)}; color: inherit`,
                    };
                },
            },
        };
    },
}).configure({ multicolor: true });
```

- [ ] **Step 4: Enregistrer l'extension dans l'éditeur et le lecteur**

`ScenarioEditor.tsx` : `import { ScenarioHighlight } from "./extensions/ScenarioHighlight";` et ajouter `ScenarioHighlight,` juste après `Color,` dans `extensions`.

`ScenarioReader.tsx` : `import { ScenarioHighlight } from "../editor/extensions/ScenarioHighlight";` et insérer `ScenarioHighlight` après `Color` dans le tableau `extensions` (sinon le lecteur, qui reconstruit le document depuis le JSON, perd la marque).

- [ ] **Step 5: Ajouter les clés i18n**

`messages/fr.json` → `scenario.toolbar.highlight`: `"Surligner"` ; `messages/en.json` → `scenario.toolbar.highlight`: `"Highlight"`.

- [ ] **Step 6: Ajouter le bouton dans la toolbar**

Dans `ScenarioToolbar.tsx`, ajouter `Highlighter` à l'import lucide, puis, **à l'intérieur** du `<div ref={popoverRef}>` créé à la Task 3, après le `<div className="relative">` de la couleur du texte :

```tsx
<div className="relative">
    <ToolbarButton
        onClick={() => setOpenPopover((v) => (v === "highlight" ? null : "highlight"))}
        isActive={editor.isActive("highlight")}
        title={t("highlight")}
    >
        <Highlighter size={iconSize} />
    </ToolbarButton>
    {openPopover === "highlight" && (
        <div className="absolute left-0 top-full z-10 mt-1 rounded-md border bg-background p-2 shadow-md">
            <ColorPalette
                value={editor.getAttributes("highlight").color ?? null}
                onChange={(color) => {
                    if (color) editor.chain().focus().setHighlight({ color }).run();
                    else editor.chain().focus().unsetHighlight().run();
                    setOpenPopover(null);
                }}
            />
        </div>
    )}
</div>
```

- [ ] **Step 7: Typecheck et lint**

Run: `npm run typecheck && npm run lint`
Expected: aucune erreur.

- [ ] **Step 8: Vérifier dans le navigateur**

- sélectionner du texte → Surligner → Jaune : fond jaune semi-transparent, texte lisible ;
- ouvrir Surligner ferme le popover Couleur et inversement ;
- une couleur ajoutée via « + » depuis Surligner apparaît aussi dans la palette Couleur ;
- attendre la sauvegarde auto (≈ 1,5 s), recharger : surlignage conservé ; passer en mode lecture : surlignage visible ;
- basculer en thème sombre : texte toujours lisible ;
- « Défaut » retire le surlignage.

- [ ] **Step 9: Passer le ticket surlignage en TEST dans Notion**

`notion-update-page` sur `3bd127d4-78e1-80fd-b335-c02498a59e25`, `properties: { "Status": "TEST" }`.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/components/scenario/editor/extensions/ScenarioHighlight.ts src/components/scenario/editor/ScenarioEditor.tsx src/components/scenario/reader/ScenarioReader.tsx src/components/scenario/editor/ScenarioToolbar.tsx messages/fr.json messages/en.json
git commit -m "feat(editor): surlignage multicolore du texte"
```

---

### Task 5: Helpers purs du bloc MJ

**Files:**
- Create: `src/components/scenario/editor/extensions/gmOnlyAttrs.ts`
- Test: `src/components/scenario/editor/extensions/gmOnlyAttrs.test.mjs`

**Interfaces:**
- Produces :
  - `DEFAULT_GM_EMOJI = "🙈"`
  - `GM_EMOJI_PRESETS: string[]` (12 emojis)
  - `GM_LABEL_MAX = 40`
  - `normalizeGmEmoji(value: unknown): string | null`
  - `normalizeGmLabel(value: unknown): string | null`

- [ ] **Step 1: Passer le ticket MJ en DOING dans Notion**

`notion-update-page` sur `3bd127d4-78e1-806c-aa99-f552605af5fd`, `properties: { "Status": "DOING" }`.

- [ ] **Step 2: Écrire les tests**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    DEFAULT_GM_EMOJI,
    GM_EMOJI_PRESETS,
    GM_LABEL_MAX,
    normalizeGmEmoji,
    normalizeGmLabel,
} from "./gmOnlyAttrs.ts";

test("normalizeGmEmoji keeps only the first grapheme", () => {
    assert.equal(normalizeGmEmoji("🔒"), "🔒");
    assert.equal(normalizeGmEmoji("  🔒 "), "🔒");
    assert.equal(normalizeGmEmoji("🧙‍♂️abc"), "🧙‍♂️");
    assert.equal(normalizeGmEmoji("🇫🇷🇬🇧"), "🇫🇷");
});

test("normalizeGmEmoji returns null for empty or non-string values", () => {
    for (const bad of ["", "   ", null, undefined, 42]) {
        assert.equal(normalizeGmEmoji(bad), null, String(bad));
    }
});

test("normalizeGmLabel trims and nulls empty labels", () => {
    assert.equal(normalizeGmLabel("  Secret du MJ  "), "Secret du MJ");
    assert.equal(normalizeGmLabel("   "), null);
    assert.equal(normalizeGmLabel(""), null);
    assert.equal(normalizeGmLabel(null), null);
});

test("normalizeGmLabel caps the label in code points", () => {
    assert.equal(normalizeGmLabel("a".repeat(50)), "a".repeat(GM_LABEL_MAX));
    assert.equal(normalizeGmLabel("🐉".repeat(45)), "🐉".repeat(GM_LABEL_MAX));
});

test("GM_EMOJI_PRESETS starts with the default emoji and holds 12 graphemes", () => {
    assert.equal(GM_EMOJI_PRESETS[0], DEFAULT_GM_EMOJI);
    assert.equal(GM_EMOJI_PRESETS.length, 12);
    for (const e of GM_EMOJI_PRESETS) assert.equal(normalizeGmEmoji(e), e);
});
```

- [ ] **Step 3: Vérifier que les tests échouent**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '.../gmOnlyAttrs.ts'`.

- [ ] **Step 4: Implémenter**

```ts
// Valeurs et normalisation des attributs du bloc « MJ uniquement ».
// Module pur, sans import runtime : testé directement par `node --test`.

export const DEFAULT_GM_EMOJI = "🙈";

export const GM_EMOJI_PRESETS = ["🙈", "🔒", "👁️", "💀", "📜", "⚔️", "🔮", "🐉", "💰", "⚠️", "🎲", "🗝️"];

export const GM_LABEL_MAX = 40;

// Premier graphème (un emoji composé comme 🧙‍♂️ ou 🇫🇷 compte pour un), ou null.
export function normalizeGmEmoji(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    return first.done ? null : first.value.segment;
}

// Libellé nettoyé, limité à GM_LABEL_MAX code points ; null = libellé traduit.
export function normalizeGmLabel(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return Array.from(trimmed).slice(0, GM_LABEL_MAX).join("");
}
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/scenario/editor/extensions/gmOnlyAttrs.ts src/components/scenario/editor/extensions/gmOnlyAttrs.test.mjs
git commit -m "feat(editor): normalisation des attributs du bloc MJ"
```

---

### Task 6: Bloc « MJ uniquement » personnalisable

**Files:**
- Create: `src/components/scenario/editor/extensions/GmOnlyBlockView.tsx`
- Modify: `src/components/scenario/editor/extensions/GmOnlyBlock.ts`
- Modify: `src/app/globals.css:300-314`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `normalizeHex` (Task 2) ; `<ColorPalette>`, `useDismiss` (Task 3) ; `DEFAULT_GM_EMOJI`, `GM_EMOJI_PRESETS`, `GM_LABEL_MAX`, `normalizeGmEmoji`, `normalizeGmLabel` (Task 5).
- Produces: attributs `gmOnlyBlock.attrs.{color, emoji, label}` (tous `string | null`).

- [ ] **Step 1: Ajouter les clés i18n**

`messages/fr.json`, sous `scenario` :

```json
"gmOnly": {
    "defaultLabel": "MJ uniquement",
    "customize": "Personnaliser la section",
    "color": "Couleur",
    "emoji": "Emoji",
    "customEmoji": "Autre emoji…",
    "text": "Texte",
    "reset": "Réinitialiser"
}
```

`messages/en.json`, sous `scenario` :

```json
"gmOnly": {
    "defaultLabel": "GM only",
    "customize": "Customize section",
    "color": "Color",
    "emoji": "Emoji",
    "customEmoji": "Other emoji…",
    "text": "Text",
    "reset": "Reset"
}
```

- [ ] **Step 2: Créer `GmOnlyBlockView.tsx`**

```tsx
"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ColorPalette } from "@/components/ui/ColorPalette";
import { Input } from "@/components/ui/input";
import { useDismiss } from "@/hooks/use-dismiss";
import { normalizeHex } from "@/lib/colors";
import {
    DEFAULT_GM_EMOJI,
    GM_EMOJI_PRESETS,
    GM_LABEL_MAX,
    normalizeGmEmoji,
    normalizeGmLabel,
} from "./gmOnlyAttrs";

type Attrs = { color: string | null; emoji: string | null; label: string | null };

function GmOnlySettings({
    attrs,
    onChange,
}: {
    attrs: Attrs;
    onChange: (patch: Partial<Attrs>) => void;
}) {
    const t = useTranslations("scenario.gmOnly");
    // Brouillon local : l'attribut est normalisé (trim) à chaque frappe,
    // l'input doit pouvoir afficher l'espace qu'on est en train de taper.
    const [labelDraft, setLabelDraft] = useState(attrs.label ?? "");
    const emoji = attrs.emoji ?? DEFAULT_GM_EMOJI;

    return (
        <div className="not-prose absolute left-0 top-full z-20 mt-1 w-60 space-y-3 rounded-md border bg-background p-3 text-foreground shadow-md">
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("color")}</p>
                <ColorPalette value={attrs.color} onChange={(color) => onChange({ color })} />
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("emoji")}</p>
                <div className="grid grid-cols-6 gap-1">
                    {GM_EMOJI_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => onChange({ emoji: preset === DEFAULT_GM_EMOJI ? null : preset })}
                            className={`h-7 rounded text-base hover:bg-muted ${
                                preset === emoji ? "bg-muted ring-1 ring-ring" : ""
                            }`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
                <Input
                    className="mt-2 h-8"
                    placeholder={t("customEmoji")}
                    maxLength={16}
                    onChange={(e) => {
                        const value = normalizeGmEmoji(e.target.value);
                        if (value) onChange({ emoji: value === DEFAULT_GM_EMOJI ? null : value });
                    }}
                />
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("text")}</p>
                <Input
                    className="h-8"
                    value={labelDraft}
                    placeholder={t("defaultLabel")}
                    maxLength={GM_LABEL_MAX}
                    onChange={(e) => {
                        setLabelDraft(e.target.value);
                        onChange({ label: normalizeGmLabel(e.target.value) });
                    }}
                />
            </div>
            <button
                type="button"
                onClick={() => {
                    setLabelDraft("");
                    onChange({ color: null, emoji: null, label: null });
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <RotateCcw size={12} />
                {t("reset")}
            </button>
        </div>
    );
}

// Rendu du bloc MJ, partagé par l'éditeur et le lecteur. La pastille n'est
// cliquable que si l'éditeur est éditable.
export function GmOnlyBlockView({ node, editor, updateAttributes }: NodeViewProps) {
    const t = useTranslations("scenario.gmOnly");
    const [open, setOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(headerRef, open, close);

    const attrs: Attrs = {
        color: normalizeHex(node.attrs.color),
        emoji: normalizeGmEmoji(node.attrs.emoji),
        label: normalizeGmLabel(node.attrs.label),
    };
    const pillText = `${attrs.emoji ?? DEFAULT_GM_EMOJI} ${attrs.label ?? t("defaultLabel")}`;
    const style = attrs.color ? ({ "--gm-color": attrs.color } as CSSProperties) : undefined;

    return (
        <NodeViewWrapper className="scenario-gm-only-block" data-gm-only="true" style={style}>
            <div ref={headerRef} contentEditable={false} className="scenario-gm-only-header not-prose">
                {editor.isEditable ? (
                    <button
                        type="button"
                        title={t("customize")}
                        onClick={() => setOpen((v) => !v)}
                        className="scenario-gm-only-pill"
                    >
                        {pillText}
                    </button>
                ) : (
                    <span className="scenario-gm-only-pill">{pillText}</span>
                )}
                {open && editor.isEditable && (
                    <GmOnlySettings attrs={attrs} onChange={(patch) => updateAttributes(patch)} />
                )}
            </div>
            <NodeViewContent />
        </NodeViewWrapper>
    );
}
```

- [ ] **Step 3: Ajouter attributs et NodeView à `GmOnlyBlock.ts`**

Ajouter les imports :

```ts
import { ReactNodeViewRenderer } from "@tiptap/react";
import { normalizeHex } from "@/lib/colors";
import { normalizeGmEmoji, normalizeGmLabel } from "./gmOnlyAttrs";
import { GmOnlyBlockView } from "./GmOnlyBlockView";
```

puis, dans `Node.create({...})`, après `defining: true,` :

```ts
    // null = valeur par défaut (couleur destructive, 🙈, libellé traduit) :
    // le contenu existant, sans ces attributs, s'affiche comme avant.
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element) => normalizeHex(element.getAttribute("data-gm-color")),
                renderHTML: (attributes) => {
                    const color = normalizeHex(attributes.color);
                    return color ? { "data-gm-color": color } : {};
                },
            },
            emoji: {
                default: null,
                parseHTML: (element) => normalizeGmEmoji(element.getAttribute("data-gm-emoji")),
                renderHTML: (attributes) => (attributes.emoji ? { "data-gm-emoji": attributes.emoji } : {}),
            },
            label: {
                default: null,
                parseHTML: (element) => normalizeGmLabel(element.getAttribute("data-gm-label")),
                renderHTML: (attributes) => (attributes.label ? { "data-gm-label": attributes.label } : {}),
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(GmOnlyBlockView);
    },
```

`parseHTML` et `renderHTML` existants restent inchangés (copier-coller et `getHTML`).

- [ ] **Step 4: Remplacer les styles du bloc dans `globals.css`**

Remplacer les lignes 300 à 314 (`.scenario-gm-only-block`, son `::before` et les deux règles `html[lang=…]`) par :

```css
/* Bloc « MJ uniquement ». --gm-color vaut la couleur choisie (posée en
   style inline par la NodeView) ou, par défaut, le token destructive. */
.scenario-gm-only-block {
  --gm-color: hsl(var(--destructive));
  @apply relative my-3 rounded-md border-l-4 px-4 pb-3 pt-2;
  border-left-color: color-mix(in srgb, var(--gm-color) 40%, transparent);
  background-color: color-mix(in srgb, var(--gm-color) 5%, transparent);
}

.scenario-gm-only-header {
  @apply relative mb-1;
}

.scenario-gm-only-pill {
  @apply inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium;
  color: var(--gm-color);
  background-color: color-mix(in srgb, var(--gm-color) 15%, transparent);
}

button.scenario-gm-only-pill:hover {
  background-color: color-mix(in srgb, var(--gm-color) 25%, transparent);
}
```

(40 % / 5 % / 15 % reprennent les opacités actuelles `destructive/40`, `/5`, `/15` : un bloc non personnalisé garde le même rendu.)

- [ ] **Step 5: Typecheck, lint, tests**

Run: `npm run typecheck && npm run lint && npm run test:unit`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 6: Vérifier dans le navigateur**

- un bloc MJ **existant** s'affiche comme avant en fr (« 🙈 MJ uniquement ») et en en (« 🙈 GM only ») ;
- en édition, clic sur la pastille → popover ; choisir Bleu, 🔒, taper « Secret du MJ » (avec espace) → la pastille et le bloc changent en direct ;
- Ctrl/Cmd+Z annule la personnalisation ;
- taper dans les champs du popover n'écrit pas dans le document ;
- clic extérieur / Échap ferme le popover ;
- après sauvegarde auto et rechargement, la personnalisation est conservée ; en mode lecture, elle est visible et la pastille n'est pas cliquable ;
- « Réinitialiser » rend le bloc par défaut, qui suit de nouveau la langue ;
- créer un nouveau bloc via la toolbar → rendu par défaut.

- [ ] **Step 7: Passer le ticket MJ et l'epic en TEST dans Notion**

`notion-update-page` avec `properties: { "Status": "TEST" }` sur `3bd127d4-78e1-806c-aa99-f552605af5fd`, puis sur l'epic `3bd127d4-78e1-8098-a0a1-dcea81ab532e` (les trois sous-tickets sont alors en TEST).

- [ ] **Step 8: Commit**

```bash
git add src/components/scenario/editor/extensions/GmOnlyBlockView.tsx src/components/scenario/editor/extensions/GmOnlyBlock.ts src/app/globals.css messages/fr.json messages/en.json
git commit -m "feat(editor): section MJ uniquement personnalisable (couleur, emoji, libellé)"
```

---

### Task 7: Vérification finale

- [ ] **Step 1: Suite complète**

Run: `npm run test:unit && npm run typecheck && npm run lint && npm run build`
Expected: tout passe ; `next build` sans erreur.

- [ ] **Step 2: Recette croisée dans le navigateur**

- une couleur ajoutée dans une partie est proposée dans le scénario d'une autre partie ;
- la palette du bloc MJ et celles de la toolbar partagent la même liste ;
- aucune erreur dans la console navigateur pendant la recette.

- [ ] **Step 3: Rapport à Soren**

Résumer ce qui est fait, l'état Notion (trois sous-tickets + epic en TEST, jamais DONE) et proposer la suite (merge / PR) via superpowers:finishing-a-development-branch.
