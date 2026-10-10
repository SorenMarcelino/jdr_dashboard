import CharacterSheetTemplate from "../models/CharacterSheetTemplateModel.mjs";

// Template : HYDRE – Chasseurs de monstres (Elder Craft, 2023).
// Système d100 simplifié dérivé du Basic System : 5 caractéristiques et
// 23 compétences en pourcentage, une ou plusieurs compétences spéciales.
// Toutes les valeurs (y compris PV, initiative, encombrement) sont saisies
// à la main par le joueur, comme sur la fiche papier.

// Caractéristique = score sur 100 (10 à 80 à la création).
const characteristic = (id, label) => ({ id, label, type: "number", section: "characteristics", defaultValue: 50, min: 0, max: 100 });

// Compétence = pourcentage ; les améliorations permettent de dépasser 70 %.
const skill = (id, label) => ({ id, label, type: "number", section: "skills", defaultValue: 0, min: 0, max: 100 });

// Ligne d'arme de la fiche : nom / dégâts / bonus aux dégâts.
const WEAPON_ROWS = [1, 2, 3, 4];
const weapon = (n) => ({
    group: { id: `weapon_${n}`, label: `Arme ${n}`, section: "weapons", order: n, columns: 3 },
    fields: [
        { id: `weapon_${n}_name`, label: "Arme", type: "text", section: "weapons", group: `weapon_${n}`, defaultValue: "" },
        { id: `weapon_${n}_damage`, label: "Dégâts", type: "text", section: "weapons", group: `weapon_${n}`, defaultValue: "" },
        { id: `weapon_${n}_bonus`, label: "Bonus aux dégâts", type: "text", section: "weapons", group: `weapon_${n}`, defaultValue: "" },
    ],
});
const WEAPONS = WEAPON_ROWS.map(weapon);

export const HYDRE_SKILLS = [
    ["crafting", "Artisanat, construire"],
    ["ranged_combat", "Combat à distance"],
    ["melee_combat", "Combat rapproché"],
    ["nature_lore", "Connaissance de la nature"],
    ["secrets_lore", "Connaissance des secrets"],
    ["occult_lore", "Connaissances occultes"],
    ["athletics", "Courir, sauter"],
    ["stealth", "Discrétion"],
    ["law", "Droit"],
    ["dodge", "Esquiver"],
    ["intimidate", "Intimider"],
    ["read_write", "Lire, écrire"],
    ["persuade", "Mentir, convaincre"],
    ["perception", "Perception"],
    ["pilot", "Piloter"],
    ["psychology", "Psychologie"],
    ["reflexes", "Réflexes"],
    ["locks_traps", "Serrures et pièges"],
    ["heal", "Soigner"],
    ["survival", "Survie"],
    ["vigor", "Vigueur"],
    ["steal", "Voler"],
    ["willpower", "Volonté"],
];

export const hydreTemplate = {
    systemId: "hydre",
    name: "Hydre – Chasseurs de monstres",

    sections: [
        { id: "header", title: "Chasseur de l'Hydre", order: 0, columns: 3 },
        { id: "characteristics", title: "Caractéristiques", order: 1, columns: 4 },
        { id: "vitals", title: "État & combat", order: 2, columns: 4 },
        { id: "synthesis", title: "Phrase de synthèse", order: 3, columns: 2 },
        { id: "skills", title: "Compétences", order: 4, columns: 3 },
        { id: "special", title: "Compétences spéciales", order: 5, columns: 1 },
        { id: "weapons", title: "Armes", order: 6, columns: 1 },
        { id: "possessions", title: "Possessions", order: 7, columns: 2 },
        { id: "notes", title: "Notes", order: 8, columns: 2 },
    ],

    groups: WEAPONS.map((w) => w.group),

    fields: [
        // --- Identité ---
        { id: "name", label: "Nom", type: "text", section: "header", defaultValue: "" },
        { id: "concept", label: "Concept", type: "text", section: "header", defaultValue: "" },
        { id: "age", label: "Âge", type: "text", section: "header", defaultValue: "" },

        // --- Caractéristiques ---
        characteristic("charisma", "Charisme"),
        characteristic("dexterity", "Dextérité"),
        characteristic("endurance", "Endurance"),
        characteristic("strength", "Force"),
        characteristic("intelligence", "Intelligence"),

        // --- État & combat ---
        { id: "hp_max", label: "Points de vie", type: "number", section: "vitals", defaultValue: 8, min: 0 },
        { id: "wounds", label: "Blessures", type: "number", section: "vitals", defaultValue: 0, min: 0 },
        { id: "protection_melee", label: "Protection (arme blanche)", type: "number", section: "vitals", defaultValue: 0, min: 0 },
        { id: "protection_ranged", label: "Protection (à distance)", type: "number", section: "vitals", defaultValue: 0, min: 0 },
        { id: "initiative", label: "Bonus d'initiative (+1D6)", type: "number", section: "vitals", defaultValue: 0, min: 0 },

        // --- Phrase de synthèse ---
        { id: "awesome_because", label: "Je suis génial·e parce que…", type: "textarea", section: "synthesis", defaultValue: "" },
        { id: "outcast_because", label: "…mais je ne pourrai plus jamais me mêler à ceux qui ignorent l'existence de l'occulte parce que…", type: "textarea", section: "synthesis", defaultValue: "" },

        // --- Compétences ---
        ...HYDRE_SKILLS.map(([id, label]) => skill(id, label)),

        // --- Compétences spéciales ---
        { id: "special_abilities", label: "Compétences spéciales", type: "textarea", section: "special", defaultValue: "", fullWidth: true },

        // --- Armes ---
        ...WEAPONS.flatMap((w) => w.fields),

        // --- Possessions ---
        { id: "possessions", label: "Possessions", type: "textarea", section: "possessions", defaultValue: "" },
        { id: "encumbrance", label: "Encombrement (objets max.)", type: "number", section: "possessions", defaultValue: 10, min: 0 },

        // --- Notes ---
        { id: "portrait", label: "Portrait (URL)", type: "image", section: "notes", defaultValue: "" },
        { id: "description", label: "Description", type: "textarea", section: "notes", defaultValue: "" },
        { id: "notes", label: "Notes", type: "textarea", section: "notes", defaultValue: "", fullWidth: true },
    ],
};

export async function seedHydre() {
    // Upsert idempotent : la définition est rejouée à chaque démarrage.
    await CharacterSheetTemplate.findOneAndUpdate(
        { systemId: hydreTemplate.systemId },
        { $set: hydreTemplate },
        { upsert: true, new: true }
    );
    console.log("[Seed] Hydre template synced.");
}
