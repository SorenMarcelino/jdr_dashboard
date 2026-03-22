import mongoose from "mongoose";

const characterSheetInstanceSchema = new mongoose.Schema({
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    systemId: { type: String, required: true },
    values: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

characterSheetInstanceSchema.index({ gameId: 1, playerId: 1 }, { unique: true });

export default mongoose.model("CharacterSheetInstance", characterSheetInstanceSchema);
