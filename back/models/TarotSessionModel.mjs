import mongoose from "mongoose";
import { TAROT_SPREADS } from "../config/tarotRegistry.mjs";

export const tarotCardSchema = new mongoose.Schema({
    cardId: { type: String, required: true },
    reversed: { type: Boolean, default: false },
}, { _id: false });

// Tirage de tarot en cours d'une partie (un document par partie, upsert sur
// gameId). Le MJ l'ouvre en accordant le tirage à un joueur ; le serveur
// mélange le paquet et tire chaque lame : le client n'envoie jamais de carte.
// Sans document, la table est vide.
const tarotSessionSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ["open", "done"],
        default: "open",
    },
    spread: {
        type: String,
        enum: Object.keys(TAROT_SPREADS),
        required: true,
    },
    allowReversed: { type: Boolean, default: true },
    // Secret : seuls le MJ et le tireur voient les lames.
    secret: { type: Boolean, default: false },
    drawerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Nom affiché du tireur. Pour un PNJ, c'est son nom ; le MJ tire à sa place
    // (drawerId = MJ).
    drawerName: { type: String, default: "" },
    npc: { type: Boolean, default: false },
    // Lames restantes, dans l'ordre tiré au sort à l'ouverture.
    deck: { type: [String], default: [] },
    cards: { type: [tarotCardSchema], default: [] },
    // Message de chat créé quand le tirage est complet.
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});

export const TarotSession = mongoose.model("TarotSession", tarotSessionSchema);
