# Rédaction des scénarios : palette, surlignage, section « MJ uniquement »

- **Date :** 2026-09-19
- **Sprint :** Sprint 8 — V1.1 — Stats & Améliorations
- **Epic Notion :** Améliorations de la rédaction des scénarios
- **Tickets :** Ajout de la palette de couleurs pour le texte · Permettre de surligner le texte · Pouvoir personnaliser la section « MJ uniquement »

## Contexte

L'éditeur de scénario (TipTap 3, `src/components/scenario/editor/`) propose
aujourd'hui une couleur de texte parmi 8 valeurs codées en dur dans
`ScenarioToolbar.tsx`, et un bloc `gmOnlyBlock` dont la pastille « 🙈 MJ
uniquement » est un pseudo-élément CSS `::before` (`src/app/globals.css`), donc
ni cliquable ni personnalisable par bloc. Le surlignage n'existe pas.

Remarque : la description Notion du ticket « Permettre de surligner le texte »
décrit en réalité la palette (composant réutilisable, sauvegarde des couleurs,
couleurs par défaut conservées). Ce spec la traite comme la fondation commune
aux trois tickets.

## Décisions

| Question | Décision |
|---|---|
| Portée de la sauvegarde des couleurs | Par utilisateur, en base (`User.savedColors`) |
| Surlignage | Multicolore, même palette et même liste de couleurs sauvegardées que le texte |
| Choix de l'emoji du bloc MJ | Grille de 12 emojis prédéfinis + champ libre, sans dépendance |
| Rendu de la pastille MJ | React NodeView (bouton réel), partagé entre éditeur et lecteur |
| Portée | Éditeur et lecteur de scénario uniquement ; `KnowledgeEditor` hors périmètre |

## 1. Palette de couleurs et couleurs sauvegardées

### Backend

- `back/models/UserModel.mjs` : champ `savedColors: { type: [String], default: [] }`.
- `back/validation/schemas.mjs` : `savedColorsSchema = z.object({ colors: z.array(hex).max(24) })`
  où `hex` accepte `#rgb` / `#rrggbb` (casse libre). La normalisation
  (minuscules, `#rgb` → `#rrggbb`, dédoublonnage en gardant le premier) se
  fait dans le service, pas dans Zod.
- `back/services/userService.mjs` : `normalizeSavedColors(colors)` (pure,
  exportée pour les tests), `getSavedColors(userId)` et
  `setSavedColors(userId, colors)` (normalise puis `findByIdAndUpdate`).
- `back/routes/api.mjs` (monté sous `/api`), à côté de `/profile` et sur le
  même modèle (`requireAuth`, `validate`, `asyncHandler`) :
  - `GET /profile/saved-colors` → `{ success: true, colors }`
  - `PUT /profile/saved-colors` (body `{ colors }`) → remplace la liste
    entière, renvoie `{ success: true, colors }` normalisées.

Le PUT remplace la liste plutôt que d'exposer ajout/suppression : un seul
endpoint, idempotent, et l'ordre est maîtrisé par le client.

### Frontend

- `src/lib/colors.ts` (pur, sans React, testable avec `node --test`) :
  - `DEFAULT_COLORS` : les 7 couleurs actuelles (`{ key, value }`),
    déplacées depuis `ScenarioToolbar.tsx` (« Défaut » est géré par la
    palette) ;
  - `normalizeHex(value): string | null` ;
  - `addSavedColor(list, color)` : normalise, place en tête, dédoublonne,
    tronque à 24 ; ignore une couleur déjà présente dans les défauts.
- `src/hooks/use-saved-colors.ts` : charge `GET /api/profile/saved-colors` une seule
  fois (promesse partagée au niveau module, abonnés notifiés), expose
  `{ colors, addColor, removeColor }`. Mise à jour optimiste puis `PUT` ;
  en cas d'échec, retour à la liste précédente.
- `src/components/ui/ColorPalette.tsx`, indépendant de TipTap :
  - props : `value: string | null`, `onChange(color: string | null)` ;
  - ligne 1 : les couleurs par défaut (la pastille « Défaut » envoie `null`) ;
  - ligne 2 : couleurs sauvegardées, chacune supprimable par une petite ×
    au survol ;
  - bouton « + » ouvrant un `<input type="color">` natif ; la couleur choisie
    est appliquée et ajoutée aux couleurs sauvegardées ;
  - la couleur courante (`value`) est entourée d'un anneau.

## 2. Surlignage

- Dépendance : `@tiptap/extension-highlight`, à la version de TipTap
  réellement installée (3.29.2).
- `src/components/scenario/editor/extensions/ScenarioHighlight.ts` :
  `Highlight.configure({ multicolor: true }).extend({ renderHTML })`. Le rendu
  garde `data-color="<hex>"` et applique
  `background-color: color-mix(in srgb, <hex> 35%, transparent)` pour rester
  lisible en clair comme en sombre. Le `parseHTML` d'origine (qui lit
  `data-color`) est conservé, le copier-coller fait donc l'aller-retour.
- Enregistré dans `ScenarioEditor.tsx` **et** `ScenarioReader.tsx` : le
  lecteur reconstruit le document depuis le JSON et perdrait une marque
  inconnue.
- `ScenarioToolbar.tsx` :
  - nouveau bouton « Surligner » (icône lucide `Highlighter`) à côté de la
    couleur du texte, actif si la sélection est surlignée ;
  - les deux boutons ouvrent `<ColorPalette>` ; « Défaut » appelle
    `unsetColor()` / `unsetHighlight()` ;
  - un seul popover ouvert à la fois ; fermeture au clic extérieur et à
    Échap (aujourd'hui le popover couleur ne se ferme qu'en choisissant).

## 3. Section « MJ uniquement » personnalisable

### Modèle

`gmOnlyBlock` reçoit trois attributs, tous `null` par défaut. `null` signifie
« valeur par défaut » : **le contenu existant s'affiche exactement comme
aujourd'hui, sans migration.**

| Attribut | Valeur | `null` = |
|---|---|---|
| `color` | hex `#rrggbb` | rouge actuel (tokens `destructive`) |
| `emoji` | un graphème | 🙈 |
| `label` | texte, 40 caractères max | libellé traduit (« MJ uniquement » / « GM only ») |

Un bloc non personnalisé suit donc la langue de l'interface. Vider le libellé
le remet à `null`.

Sérialisation HTML : `data-gm-color`, `data-gm-emoji`, `data-gm-label` en plus
de `data-gm-only`, lus par `parseHTML` (copier-coller conservé).

Helpers purs dans `src/components/scenario/editor/extensions/gmOnlyAttrs.ts` :
`normalizeGmEmoji` (premier graphème via `Intl.Segmenter`, vide → `null`),
`normalizeGmLabel` (trim, 40 max, vide → `null`), couleur via `normalizeHex`.

### Rendu

- `GmOnlyBlock.ts` ajoute `addNodeView()` → `ReactNodeViewRenderer(GmOnlyBlockView)`.
- `GmOnlyBlockView.tsx` : `NodeViewWrapper` portant `--gm-color` (si `color`
  est défini), une pastille `<button contentEditable={false}>` affichant
  `emoji + libellé`, puis `NodeViewContent`.
- `globals.css` : `.scenario-gm-only-block` utilise
  `--gm-color` (défaut `hsl(var(--destructive))`) pour la bordure (40 %), le
  fond (5 % via `color-mix`) et la pastille (fond 15 %, texte plein) : les
  opacités actuelles, pour qu'un bloc non personnalisé ne change pas. Le
  `::before` et ses deux règles `html[lang]` sont supprimés.

### Popover

Ouvert au clic sur la pastille, **seulement si `editor.isEditable`** ; dans le
lecteur la pastille est une simple étiquette.

- **Couleur** : `<ColorPalette>` (mêmes couleurs sauvegardées) ;
- **Emoji** : grille 🙈 🔒 👁️ 💀 📜 ⚔️ 🔮 🐉 💰 ⚠️ 🎲 🗝️ + champ libre ;
- **Texte** : input avec le libellé traduit en placeholder ;
- **Réinitialiser** : remet les trois attributs à `null`.

Chaque modification passe par `updateAttributes` (undo/redo fonctionnent).
Fermeture au clic extérieur et à Échap.

## i18n

Nouvelles clés dans `messages/fr.json` et `messages/en.json` :
`scenario.toolbar.highlight`, `common.colorPalette.*` (défaut, ajouter,
supprimer), `scenario.gmOnly.*` (libellé par défaut, couleur, emoji, texte,
réinitialiser).

## Tests et vérification

- **Unitaires** (`npm run test:unit`) :
  - `schemas.test.mjs` : `savedColorsSchema` (hex valides/invalides, > 24 refusé) ;
  - `normalizeSavedColors` (sans base) : minuscules, `#rgb` → `#rrggbb`,
    dédoublonnage ;
  - `src/lib/colors.test.mjs` : `normalizeHex`, `addSavedColor` ;
  - `gmOnlyAttrs.test.mjs` : emoji → premier graphème, libellé, couleur invalide → `null`.
- **Build** : `tsc` / `next build` sans erreur.
- **Manuel, dans le navigateur** :
  - un bloc MJ existant s'affiche à l'identique (fr et en) ;
  - personnalisation couleur/emoji/texte conservée après rechargement et
    visible dans le lecteur, pastille non cliquable dans le lecteur ;
  - surlignage : éditeur → sauvegarde → rechargement → lecteur, lisible en
    thème sombre ;
  - couleur sauvegardée retrouvée après rechargement et dans une autre partie.

## Ordre de réalisation et suivi Notion

1. Epic → DOING au démarrage.
2. Palette + couleurs sauvegardées → ticket « Ajout de la palette » DOING puis TEST.
3. Surlignage → ticket « Permettre de surligner le texte » DOING puis TEST.
4. Bloc MJ → ticket « Pouvoir personnaliser la section “MJ uniquement” » DOING puis TEST.
5. Epic → TEST quand les trois sous-tickets sont en TEST.

Jamais DONE (réservé aux testeurs). Aucun commit sans accord explicite.

## Hors périmètre

- Toolbar et palette dans `KnowledgeEditor`.
- Filtrage serveur des blocs MJ pour les joueurs (inchangé).
- Couleurs sauvegardées partagées entre utilisateurs d'une même partie.
