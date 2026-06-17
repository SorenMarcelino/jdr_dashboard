import { Message } from "../models/MessageModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";

export const getMessages = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const { before, limit = 50 } = req.query;

    // Vérifier que l'utilisateur est membre de la partie
    const game = await Game.findById(gameId);
    if (!game) {
        return res.status(404).json({ success: false, message: "Game not found" });
    }

    const userId = req.user._id.toString();
    const isMember =
        game.createdBy.toString() === userId ||
        game.players.some((p) => p.toString() === userId);

    if (!isMember) {
        return res.status(403).json({ success: false, message: "Not a member of this game" });
    }

    const query = { gameId };
    if (before) {
        const beforeDate = new Date(before);
        if (Number.isNaN(beforeDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid 'before' date" });
        }
        query.createdAt = { $lt: beforeDate };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit) || 50, 100))
        .lean();

    res.json({
        success: true,
        messages: messages.reverse(),
    });
});
