import mongoose from "mongoose";
import { tarotCardSchema } from "./TarotSessionModel.mjs";

// Tirage de tarot consigné au chat (type "tarot"). Les lames sont toujours
// stockées ; un tirage secret est brouillé à l'envoi pour qui n'a pas le droit
// de le voir (cf. services/tarotService.mjs).
const tarotDrawSchema = new mongoose.Schema({
    spread: String,
    secret: { type: Boolean, default: false },
    drawerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Nom du tireur (joueur, MJ ou PNJ pour qui le MJ tire).
    drawerName: String,
    npc: { type: Boolean, default: false },
    cards: { type: [tarotCardSchema], default: [] },
}, { _id: false });

const messageSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["text", "dice-roll", "tarot"],
        required: true,
    },
    content: {
        type: String,
        default: "",
    },
    diceRoll: {
        diceType: String,
        quantity: Number,
        results: [Number],
        total: Number,
    },
    tarot: {
        type: tarotDrawSchema,
        default: undefined,
    },
}, {
    timestamps: true,
});

messageSchema.index({ gameId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
