import mongoose from "mongoose";

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
        enum: ["text", "dice-roll"],
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
}, {
    timestamps: true,
});

messageSchema.index({ gameId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
