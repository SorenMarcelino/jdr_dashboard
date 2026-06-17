import mongoose from "mongoose";
import crypto from "node:crypto";

// Génère un code d'invitation de 6 caractères, cryptographiquement aléatoire,
// sans caractères ambigus (0/O, 1/I).
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const generateInviteCode = (length = 6) => {
    const bytes = crypto.randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
        code += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
    }
    return code;
};

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Game name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    characterSheet: {
        type: String,
        required: [true, "Character sheet is required"],
    },
    thumbnail: {
        type: String,
        default: "",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    inviteCode: {
        type: String,
        unique: true,
    },
}, {
    timestamps: true,
});

// Génère un code d'invitation unique avant la sauvegarde
gameSchema.pre("save", function (next) {
    if (!this.inviteCode) {
        this.inviteCode = generateInviteCode();
    }
    next();
});

export const Game = mongoose.model("Game", gameSchema);
