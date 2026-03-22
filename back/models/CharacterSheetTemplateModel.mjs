import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ["text", "number", "textarea", "checkbox", "damage-track"],
        required: true,
    },
    section: { type: String, required: true },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
    options: [String],
}, { _id: false });

const characterSheetTemplateSchema = new mongoose.Schema({
    systemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fields: [fieldSchema],
}, { timestamps: true });

export default mongoose.model("CharacterSheetTemplate", characterSheetTemplateSchema);
