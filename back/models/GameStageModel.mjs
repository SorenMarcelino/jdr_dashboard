import mongoose from "mongoose";

// « Scène » d'une partie : le média que le MJ diffuse à tous les joueurs
// (audio, image, vidéo ou modèle 3D, référencé par URL externe).
// Un document par partie (upsert sur gameId). Persisté en Mongo pour que la
// scène survive à un redémarrage du serveur et soit servie au late-join.
const gameStageSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
        unique: true,
    },
    // null = scène vide (rien de diffusé).
    media: {
        type: {
            kind: {
                type: String,
                enum: ["audio", "image", "video", "model3d"],
                required: true,
            },
            url: { type: String, required: true },
            title: { type: String, default: "" },
        },
        default: null,
    },
    // État de lecture pour audio/vidéo. updatedAtServerMs (horloge serveur)
    // permet aux clients de calculer la position courante pendant la lecture.
    playback: {
        playing: { type: Boolean, default: false },
        positionSec: { type: Number, default: 0 },
        updatedAtServerMs: { type: Number, default: 0 },
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});

export const GameStage = mongoose.model("GameStage", gameStageSchema);
