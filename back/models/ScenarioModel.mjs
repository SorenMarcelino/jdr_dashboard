import mongoose from "mongoose";

const scenarioSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
    },
    title: {
        type: String,
        required: [true, "Le titre du scénario est requis"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    entryPageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScenarioPage",
        default: null,
    },
    currentPageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScenarioPage",
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

scenarioSchema.index({ gameId: 1 });

export const Scenario = mongoose.model("Scenario", scenarioSchema);
