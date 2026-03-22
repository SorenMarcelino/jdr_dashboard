import CharacterSheetTemplate from "../models/CharacterSheetTemplateModel.mjs";

const magnusArchivesTemplate = {
    systemId: "magnus_archives",
    name: "Magnus Archives (Cypher System)",
    fields: [
        // --- En-tête ---
        { id: "name", label: "Nom", type: "text", section: "header", defaultValue: "" },
        { id: "descriptor", label: "Descriptor", type: "text", section: "header", defaultValue: "" },
        { id: "type", label: "Type", type: "text", section: "header", defaultValue: "" },
        { id: "focus", label: "Focus", type: "text", section: "header", defaultValue: "" },
        { id: "tier", label: "Tier", type: "number", section: "header", defaultValue: 1 },
        { id: "effort", label: "Effort", type: "number", section: "header", defaultValue: 1 },
        { id: "xp", label: "XP", type: "number", section: "header", defaultValue: 0 },

        // --- Pools ---
        { id: "might_current", label: "Might (actuel)", type: "number", section: "pools", defaultValue: 0 },
        { id: "might_max", label: "Might (max)", type: "number", section: "pools", defaultValue: 0 },
        { id: "might_edge", label: "Might Edge", type: "number", section: "pools", defaultValue: 0 },
        { id: "speed_current", label: "Speed (actuel)", type: "number", section: "pools", defaultValue: 0 },
        { id: "speed_max", label: "Speed (max)", type: "number", section: "pools", defaultValue: 0 },
        { id: "speed_edge", label: "Speed Edge", type: "number", section: "pools", defaultValue: 0 },
        { id: "intellect_current", label: "Intellect (actuel)", type: "number", section: "pools", defaultValue: 0 },
        { id: "intellect_max", label: "Intellect (max)", type: "number", section: "pools", defaultValue: 0 },
        { id: "intellect_edge", label: "Intellect Edge", type: "number", section: "pools", defaultValue: 0 },

        // --- Compétences ---
        { id: "skills_trained", label: "Compétences (Trained)", type: "textarea", section: "skills", defaultValue: "" },
        { id: "skills_specialized", label: "Compétences (Specialized)", type: "textarea", section: "skills", defaultValue: "" },
        { id: "skills_inability", label: "Incapacités", type: "textarea", section: "skills", defaultValue: "" },

        // --- Capacités spéciales ---
        { id: "special_abilities", label: "Capacités spéciales", type: "textarea", section: "abilities", defaultValue: "" },

        // --- Recovery & Damage Track ---
        { id: "recovery_action", label: "Récupération (1 action)", type: "checkbox", section: "recovery", defaultValue: false },
        { id: "recovery_10min", label: "Récupération (10 min)", type: "checkbox", section: "recovery", defaultValue: false },
        { id: "recovery_1hour", label: "Récupération (1 heure)", type: "checkbox", section: "recovery", defaultValue: false },
        { id: "recovery_10hours", label: "Récupération (10 heures)", type: "checkbox", section: "recovery", defaultValue: false },
        {
            id: "damage_track",
            label: "Piste de dégâts",
            type: "damage-track",
            section: "recovery",
            defaultValue: "Hale",
            options: ["Hale", "Hurt", "Impaired", "Debilitated", "Dead"],
        },

        // --- Stress ---
        { id: "stress", label: "Stress", type: "number", section: "stress", defaultValue: 0 },

        // --- Cyphers ---
        { id: "cyphers", label: "Cyphers", type: "textarea", section: "cyphers", defaultValue: "" },

        // --- Background ---
        { id: "portrait", label: "Portrait (URL)", type: "text", section: "background", defaultValue: "" },
        { id: "background", label: "Background", type: "textarea", section: "background", defaultValue: "" },
        { id: "arcs", label: "Arcs narratifs", type: "textarea", section: "background", defaultValue: "" },
        { id: "notes", label: "Notes", type: "textarea", section: "background", defaultValue: "" },
        { id: "equipment", label: "Équipement", type: "textarea", section: "background", defaultValue: "" },
    ],
};

export async function seedMagnusArchives() {
    const existing = await CharacterSheetTemplate.findOne({ systemId: "magnus_archives" });
    if (!existing) {
        await CharacterSheetTemplate.create(magnusArchivesTemplate);
        console.log("[Seed] Magnus Archives template inserted.");
    } else {
        console.log("[Seed] Magnus Archives template already exists, skipping.");
    }
}
