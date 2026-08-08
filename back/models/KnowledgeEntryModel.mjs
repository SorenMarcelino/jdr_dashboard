import mongoose from "mongoose";

const knowledgeEntrySchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
    },
    type: {
        type: String,
        enum: ["rule", "lore"],
        required: true,
    },
    title: {
        type: String,
        required: [true, "Le titre est requis"],
        trim: true,
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: { type: "doc", content: [] },
    },
    category: {
        type: String,
        trim: true,
        default: "",
    },
    visibleToPlayers: {
        type: Boolean,
        default: false,
    },
    order: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

knowledgeEntrySchema.index({ gameId: 1, type: 1, order: 1 });

export const KnowledgeEntry = mongoose.model("KnowledgeEntry", knowledgeEntrySchema);
