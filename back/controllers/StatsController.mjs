import { Message } from "../models/MessageModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import { computeGameStats } from "../services/gameStatsService.mjs";

// GET /games/:gameId/stats — statistiques de la partie (membre uniquement).
export const getGameStats = asyncHandler(async (req, res) => {
    const { gameId } = req.params;

    const game = await Game.findById(gameId).lean();
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

    const messages = await Message.find({ gameId }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
        success: true,
        stats: computeGameStats(messages, game),
    });
});
