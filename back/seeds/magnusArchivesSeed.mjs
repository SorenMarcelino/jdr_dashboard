import CharacterSheetTemplate from "../models/CharacterSheetTemplateModel.mjs";

// Template d'exemple : The Magnus Archives (Cypher System).
// Il ne contient aucune logique de rendu — tout est décrit par les données
// (sections, groups, fields) et interprété par le renderer générique côté front.
export const magnusArchivesTemplate = {
    systemId: "magnus_archives",
    name: "Magnus Archives (Cypher System)",

    sections: [
        { id: "header", title: "Identité", order: 0, columns: 4 },
        { id: "pools", title: "Pools", order: 1, columns: 3 },
        { id: "skills", title: "Compétences", order: 2, columns: 3 },
        { id: "abilities", title: "Capacités spéciales", order: 3, columns: 1 },
        { id: "recovery", title: "Récupération", order: 4, columns: 4 },
        { id: "stress", title: "Stress", order: 5, columns: 1 },
        { id: "cyphers", title: "Cyphers", order: 6, columns: 1 },
        { id: "background", title: "Background & Notes", order: 7, columns: 2 },
    ],

    groups: [
        { id: "might", label: "Might", section: "pools", order: 0, columns: 3 },
        { id: "speed", label: "Speed", section: "pools", order: 1, columns: 3 },
        { id: "intellect", label: "Intellect", section: "pools", order: 2, columns: 3 },
    ],

    fields: [
        // --- En-tête ---
        { id: "name", label: "Nom", type: "text", section: "header", defaultValue: "" },
        { id: "descriptor", label: "Descriptor", type: "text", section: "header", defaultValue: "" },
        { id: "type", label: "Type", type: "text", section: "header", defaultValue: "" },
        { id: "focus", label: "Focus", type: "text", section: "header", defaultValue: "" },
        { id: "tier", label: "Tier", type: "number", section: "header", defaultValue: 1 },
        { id: "effort", label: "Effort", type: "number", section: "header", defaultValue: 1 },
        { id: "xp", label: "XP", type: "number", section: "header", defaultValue: 0 },

        // --- Pools (regroupés par caractéristique) ---
        { id: "might_current", label: "Actuel", type: "number", section: "pools", group: "might", defaultValue: 0 },
        { id: "might_max", label: "Max", type: "number", section: "pools", group: "might", defaultValue: 0 },
        { id: "might_edge", label: "Edge", type: "number", section: "pools", group: "might", defaultValue: 0 },
        { id: "speed_current", label: "Actuel", type: "number", section: "pools", group: "speed", defaultValue: 0 },
        { id: "speed_max", label: "Max", type: "number", section: "pools", group: "speed", defaultValue: 0 },
        { id: "speed_edge", label: "Edge", type: "number", section: "pools", group: "speed", defaultValue: 0 },
        { id: "intellect_current", label: "Actuel", type: "number", section: "pools", group: "intellect", defaultValue: 0 },
        { id: "intellect_max", label: "Max", type: "number", section: "pools", group: "intellect", defaultValue: 0 },
        { id: "intellect_edge", label: "Edge", type: "number", section: "pools", group: "intellect", defaultValue: 0 },

        // --- Compétences ---
        { id: "skills_trained", label: "Compétences (Trained)", type: "textarea", section: "skills", defaultValue: "" },
        { id: "skills_specialized", label: "Compétences (Specialized)", type: "textarea", section: "skills", defaultValue: "" },
        { id: "skills_inability", label: "Incapacités", type: "textarea", section: "skills", defaultValue: "" },

        // --- Capacités spéciales ---
        { id: "special_abilities", label: "Capacités spéciales", type: "textarea", section: "abilities", defaultValue: "", fullWidth: true },

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
            fullWidth: true,
        },

        // --- Stress ---
        { id: "stress", label: "Stress", type: "stress-track", section: "stress", defaultValue: 0, min: 0, max: 10, fullWidth: true },

        // --- Cyphers ---
        { id: "cyphers", label: "Cyphers", type: "textarea", section: "cyphers", defaultValue: "", fullWidth: true },

        // --- Background ---
        { id: "portrait", label: "Portrait (URL)", type: "image", section: "background", defaultValue: "" },
        { id: "background", label: "Background", type: "textarea", section: "background", defaultValue: "" },
        { id: "arcs", label: "Arcs narratifs", type: "textarea", section: "background", defaultValue: "" },
        { id: "notes", label: "Notes", type: "textarea", section: "background", defaultValue: "" },
        { id: "equipment", label: "Équipement", type: "textarea", section: "background", defaultValue: "" },
    ],
};

export async function seedMagnusArchives() {
    // Upsert : la définition du template système est rejouée à chaque démarrage
    // pour que toute évolution de la structure soit prise en compte.
    await CharacterSheetTemplate.findOneAndUpdate(
        { systemId: magnusArchivesTemplate.systemId },
        { $set: magnusArchivesTemplate },
        { upsert: true, new: true }
    );
    console.log("[Seed] Magnus Archives template synced.");
}
