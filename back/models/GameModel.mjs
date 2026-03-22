import mongoose from "mongoose";

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
        this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    next();
});

export const Game = mongoose.model("Game", gameSchema);
