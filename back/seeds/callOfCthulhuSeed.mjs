import CharacterSheetTemplate from "../models/CharacterSheetTemplateModel.mjs";

// Deuxième template d'exemple : L'Appel de Cthulhu 7e.
// Sa structure (8 caractéristiques avec valeur/moitié/cinquième, stats dérivées,
// piste de santé, folie...) est très différente de Magnus Archives et valide
// que le renderer générique gère n'importe quelle forme de fiche, sans code dédié.

// Génère les 3 champs (valeur / moitié / cinquième) d'une caractéristique.
const characteristic = (id, label) => ({
    group: { id, label, section: "characteristics", columns: 3 },
    fields: [
        { id: `${id}_value`, label: "Valeur", type: "number", section: "characteristics", group: id, defaultValue: 0, min: 0 },
        { id: `${id}_half`, label: "½", type: "number", section: "characteristics", group: id, defaultValue: 0, min: 0 },
        { id: `${id}_fifth`, label: "⅕", type: "number", section: "characteristics", group: id, defaultValue: 0, min: 0 },
    ],
});

const CHARACTERISTICS = [
    characteristic("str", "Force (STR)"),
    characteristic("con", "Constitution (CON)"),
    characteristic("siz", "Taille (SIZ)"),
    characteristic("dex", "Dextérité (DEX)"),
    characteristic("app", "Apparence (APP)"),
    characteristic("int", "Intelligence (INT)"),
    characteristic("pow", "Pouvoir (POW)"),
    characteristic("edu", "Éducation (EDU)"),
];

// Compétence simple = un champ number borné 0-99.
const skill = (id, label) => ({ id, label, type: "number", section: "skills", defaultValue: 0, min: 0, max: 99 });

export const callOfCthulhuTemplate = {
    systemId: "callofcthulhu",
    name: "L'Appel de Cthulhu (7e édition)",

    sections: [
        { id: "header", title: "Investigateur", order: 0, columns: 4 },
        { id: "characteristics", title: "Caractéristiques", order: 1, columns: 4 },
        { id: "derived", title: "Attributs dérivés", order: 2, columns: 4 },
        { id: "skills", title: "Compétences", order: 3, columns: 4 },
        { id: "combat", title: "Combat", order: 4, columns: 2 },
        { id: "status", title: "État & Santé mentale", order: 5, columns: 4 },
        { id: "background", title: "Historique & Notes", order: 6, columns: 2 },
    ],

    groups: CHARACTERISTICS.map((c) => c.group),

    fields: [
        // --- Investigateur ---
        { id: "name", label: "Nom", type: "text", section: "header", defaultValue: "" },
        { id: "player", label: "Joueur", type: "text", section: "header", defaultValue: "" },
        { id: "occupation", label: "Occupation", type: "text", section: "header", defaultValue: "" },
        { id: "era", label: "Époque", type: "select", section: "header", defaultValue: "Classique", options: ["Classique (1920)", "Pulp", "Moderne"] },
        { id: "age", label: "Âge", type: "number", section: "header", defaultValue: 20, min: 0 },
        { id: "residence", label: "Résidence", type: "text", section: "header", defaultValue: "" },
        { id: "birthplace", label: "Lieu de naissance", type: "text", section: "header", defaultValue: "" },

        // --- Caractéristiques (groupes valeur/½/⅕) ---
        ...CHARACTERISTICS.flatMap((c) => c.fields),

        // --- Attributs dérivés ---
        { id: "hp", label: "Points de vie", type: "number", section: "derived", defaultValue: 0, min: 0 },
        { id: "mp", label: "Points de magie", type: "number", section: "derived", defaultValue: 0, min: 0 },
        { id: "san", label: "Santé mentale (SAN)", type: "number", section: "derived", defaultValue: 0, min: 0, max: 99 },
        { id: "luck", label: "Chance", type: "number", section: "derived", defaultValue: 0, min: 0, max: 99 },
        { id: "move", label: "Mouvement (MOV)", type: "number", section: "derived", defaultValue: 8, min: 0 },

        // --- Compétences ---
        skill("spot_hidden", "Trouver objet caché"),
        skill("listen", "Écouter"),
        skill("library_use", "Bibliothèque"),
        skill("psychology", "Psychologie"),
        skill("stealth", "Discrétion"),
        skill("dodge", "Esquive"),
        skill("first_aid", "Premiers soins"),
        skill("fighting_brawl", "Combat (Bagarre)"),
        skill("firearms_handgun", "Armes à feu (Poing)"),
        skill("occult", "Occultisme"),
        skill("cthulhu_mythos", "Mythe de Cthulhu"),
        skill("persuade", "Persuasion"),
        { id: "other_skills", label: "Autres compétences", type: "textarea", section: "skills", defaultValue: "", fullWidth: true },

        // --- Combat ---
        { id: "damage_bonus", label: "Bonus aux dégâts", type: "select", section: "combat", defaultValue: "0", options: ["-2", "-1", "0", "+1D4", "+1D6", "+2D6"] },
        { id: "build", label: "Carrure", type: "number", section: "combat", defaultValue: 0 },
        { id: "weapons", label: "Armes", type: "textarea", section: "combat", defaultValue: "", fullWidth: true },

        // --- État & Santé mentale ---
        {
            id: "condition",
            label: "État physique",
            type: "damage-track",
            section: "status",
            defaultValue: "En forme",
            options: ["En forme", "Blessé", "Mourant", "Inconscient", "Mort"],
            fullWidth: true,
        },
        { id: "major_wound", label: "Blessure grave", type: "checkbox", section: "status", defaultValue: false },
        { id: "temp_insanity", label: "Folie temporaire", type: "checkbox", section: "status", defaultValue: false },
        { id: "indef_insanity", label: "Folie permanente", type: "checkbox", section: "status", defaultValue: false },

        // --- Historique & Notes ---
        { id: "portrait", label: "Portrait (URL)", type: "image", section: "background", defaultValue: "" },
        { id: "backstory", label: "Historique personnel", type: "textarea", section: "background", defaultValue: "" },
        { id: "belongings", label: "Possessions & équipement", type: "textarea", section: "background", defaultValue: "" },
        { id: "notes", label: "Notes", type: "textarea", section: "background", defaultValue: "" },
    ],
};

export async function seedCallOfCthulhu() {
    // Upsert idempotent : la définition est rejouée à chaque démarrage.
    await CharacterSheetTemplate.findOneAndUpdate(
        { systemId: callOfCthulhuTemplate.systemId },
        { $set: callOfCthulhuTemplate },
        { upsert: true, new: true }
    );
    console.log("[Seed] Call of Cthulhu template synced.");
}
