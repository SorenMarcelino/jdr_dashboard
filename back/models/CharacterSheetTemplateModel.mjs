import mongoose from "mongoose";

// Un champ = une donnée saisissable de la fiche.
const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ["text", "number", "textarea", "checkbox", "select", "damage-track", "stress-track", "image"],
        required: true,
    },
    // Section d'appartenance (cf. template.sections).
    section: { type: String, required: true },
    // Sous-bloc optionnel à l'intérieur d'une section (cf. template.groups).
    group: { type: String, default: null },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
    // Valeurs possibles (select, damage-track).
    options: [String],
    // Bornes optionnelles (number, stress-track).
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    // Force le champ à occuper toute la largeur de la grille.
    fullWidth: { type: Boolean, default: false },
}, { _id: false });

// Une section = un bloc visuel titré qui regroupe des champs.
const sectionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, default: "" },
    order: { type: Number, default: 0 },
    // Nombre de colonnes de la grille (1-4), responsive via container queries.
    columns: { type: Number, default: 2 },
}, { _id: false });

// Un groupe = un sous-bloc titré à l'intérieur d'une section (ex: une caractéristique avec plusieurs valeurs).
const groupSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, default: "" },
    section: { type: String, required: true },
    order: { type: Number, default: 0 },
    columns: { type: Number, default: 3 },
}, { _id: false });

const characterSheetTemplateSchema = new mongoose.Schema({
    systemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    // Métadonnées de mise en page — rendent la fiche entièrement pilotée par les données.
    sections: [sectionSchema],
    groups: [groupSchema],
    fields: [fieldSchema],
}, { timestamps: true });

export default mongoose.model("CharacterSheetTemplate", characterSheetTemplateSchema);
