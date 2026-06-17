import { Game, generateInviteCode } from "../models/GameModel.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";

// Les corps de requête sont validés en amont par Zod (createGameSchema /
// joinGameSchema) via le middleware `validate`.

export const createGame = asyncHandler(async (req, res) => {
    const { name, description, characterSheet, thumbnail } = req.body;

    // Retry en cas de collision (très improbable) sur le code d'invitation unique.
    let game = null;
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            game = await Game.create({
                name,
                description,
                characterSheet,
                thumbnail,
                createdBy: req.user._id,
                inviteCode: generateInviteCode(),
            });
            break;
        } catch (err) {
            if (err.code === 11000 && err.keyPattern?.inviteCode) {
                lastError = err;
                continue;
            }
            throw err;
        }
    }

    if (!game) throw lastError || new Error("Failed to generate invite code");

    return res.status(201).json({
        message: "Game created successfully",
        success: true,
        game,
    });
});

export const getUserGames = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const games = await Game.find({
        $or: [{ createdBy: userId }, { players: userId }],
    }).populate("createdBy", "username").populate("players", "username email");
    return res.status(200).json({ success: true, games });
});

// GET /games/:gameId — détail d'une partie (membre uniquement)
export const getGameById = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const userId = req.user._id;

    const game = await Game.findById(gameId)
        .populate("createdBy", "username")
        .populate("players", "username email");

    if (!game) {
        return res.status(404).json({ success: false, message: "Game not found" });
    }

    const isMember =
        game.createdBy._id.toString() === userId.toString() ||
        game.players.some((p) => p._id.toString() === userId.toString());

    if (!isMember) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, game });
});

export const joinGame = asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    const game = await Game.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!game) {
        return res.status(404).json({
            message: "Game not found. Check the invite code.",
            success: false,
        });
    }

    const userId = req.user._id;
    const isCreator = game.createdBy.toString() === userId.toString();
    const isAlreadyPlayer = game.players.some((p) => p.toString() === userId.toString());

    if (isCreator || isAlreadyPlayer) {
        return res.status(400).json({
            message: "You are already in this game.",
            success: false,
        });
    }

    game.players.push(userId);
    await game.save();

    return res.status(200).json({
        message: "Joined game successfully",
        success: true,
        game,
    });
});
