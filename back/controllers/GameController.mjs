import { Game } from "../models/GameModel.mjs";

export const createGame = async (req, res) => {
    try {
        const { name, description, characterSheet, thumbnail } = req.body;

        if (!name || !characterSheet) {
            return res.status(400).json({
                message: "Name and character sheet are required",
                success: false,
            });
        }

        const game = await Game.create({
            name,
            description,
            characterSheet,
            thumbnail,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            message: "Game created successfully",
            success: true,
            game,
        });
    } catch (error) {
        console.error("Error creating game:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

export const getUserGames = async (req, res) => {
    try {
        const userId = req.user._id;
        const games = await Game.find({
            $or: [{ createdBy: userId }, { players: userId }]
        }).populate("createdBy", "username").populate("players", "username email");
        return res.status(200).json({
            success: true,
            games,
        });
    } catch (error) {
        console.error("Error fetching games:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

export const joinGame = async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({
                message: "Invite code is required",
                success: false,
            });
        }

        const game = await Game.findOne({ inviteCode: inviteCode.toUpperCase() });

        if (!game) {
            return res.status(404).json({
                message: "Game not found. Check the invite code.",
                success: false,
            });
        }

        const userId = req.user._id;
        const isCreator = game.createdBy.toString() === userId.toString();
        const isAlreadyPlayer = game.players.some(p => p.toString() === userId.toString());

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
    } catch (error) {
        console.error("Error joining game:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};
