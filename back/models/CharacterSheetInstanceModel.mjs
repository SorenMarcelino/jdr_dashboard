import mongoose from "mongoose";

const characterSheetInstanceSchema = new mongoose.Schema({
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    systemId: { type: String, required: true },
    isNpc: { type: Boolean, default: false },
    npcName: { type: String, default: "" },
    values: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Un joueur ne peut avoir qu'une fiche par partie (ne s'applique pas aux PNJ où playerId est null)
characterSheetInstanceSchema.index(
    { gameId: 1, playerId: 1 },
    { unique: true, partialFilterExpression: { playerId: { $type: "objectId" } } }
);

// Index pour les requêtes de fiches PNJ par partie
characterSheetInstanceSchema.index({ gameId: 1, isNpc: 1 });

export default mongoose.model("CharacterSheetInstance", characterSheetInstanceSchema);
