import mongoose from "mongoose";

const scenarioPageSchema = new mongoose.Schema({
    scenarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Scenario",
        required: true,
    },
    title: {
        type: String,
        required: [true, "Le titre de la page est requis"],
        trim: true,
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: { type: "doc", content: [] },
    },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
    },
    outgoingLinks: [{
        targetPageId: { type: mongoose.Schema.Types.ObjectId, ref: "ScenarioPage" },
        label: { type: String },
        _id: false,
    }],
    tags: [{ type: String, trim: true }],
    order: { type: Number, default: 0 },
}, {
    timestamps: true,
});

scenarioPageSchema.index({ scenarioId: 1, order: 1 });

export default mongoose.model("ScenarioPage", scenarioPageSchema);
