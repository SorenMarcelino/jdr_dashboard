import { verifyAccessToken } from "../utils/SecretToken.mjs";
import { User } from "../models/UserModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { Message } from "../models/MessageModel.mjs";
import { DICE_REGISTRY, rollDice } from "../config/diceRegistry.mjs";

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(";").forEach((c) => {
        const [key, ...rest] = c.split("=");
        cookies[key.trim()] = decodeURIComponent(rest.join("="));
    });
    return cookies;
}

export function setupSocketHandlers(io) {
    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token = cookies.accessToken;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = verifyAccessToken(token);
            if (!decoded) {
                return next(new Error("Invalid or expired token"));
            }

            const user = await User.findById(decoded.id).select("-password -refreshToken");
            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.user.username} (${socket.user._id})`);

        // Join a game room
        socket.on("join-game", async (gameId) => {
            try {
                const game = await Game.findById(gameId);
                if (!game) {
                    return socket.emit("error", { message: "Game not found" });
                }

                const userId = socket.user._id.toString();
                const isMember =
                    game.createdBy.toString() === userId ||
                    game.players.some((p) => p.toString() === userId);

                if (!isMember) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }

                socket.join(`game:${gameId}`);
                socket.emit("joined-game", { gameId });
                console.log(`[Socket] ${socket.user.username} joined game:${gameId}`);
            } catch (err) {
                console.error("[Socket] join-game error:", err);
                socket.emit("error", { message: "Failed to join game" });
            }
        });

        // Leave a game room
        socket.on("leave-game", (gameId) => {
            socket.leave(`game:${gameId}`);
        });

        // Chat message
        socket.on("chat-message", async ({ gameId, content }) => {
            try {
                if (!content || !content.trim()) return;

                const message = await Message.create({
                    gameId,
                    userId: socket.user._id,
                    username: socket.user.username,
                    type: "text",
                    content: content.trim(),
                });

                io.to(`game:${gameId}`).emit("chat-message", {
                    _id: message._id,
                    gameId: message.gameId,
                    userId: message.userId,
                    username: message.username,
                    type: "text",
                    content: message.content,
                    createdAt: message.createdAt,
                });
            } catch (err) {
                console.error("[Socket] chat-message error:", err);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Dice roll — server generates results, broadcasts animation to all players
        socket.on("dice-roll", async ({ gameId, diceType, quantity }) => {
            try {
                const config = DICE_REGISTRY[diceType];
                if (!config) {
                    return socket.emit("error", { message: `Unknown dice type: ${diceType}` });
                }

                const qty = Math.max(1, Math.min(quantity || 1, config.maxQuantity));

                // Generate results server-side so all players get the same outcome
                const { results, total } = rollDice(diceType, qty);

                // Broadcast animation start with server results to ALL players
                io.to(`game:${gameId}`).emit("dice-roll-start", {
                    gameId,
                    userId: socket.user._id.toString(),
                    username: socket.user.username,
                    diceType,
                    quantity: qty,
                    results,
                    total,
                });
            } catch (err) {
                console.error("[Socket] dice-roll error:", err);
                socket.emit("error", { message: "Failed to start dice roll" });
            }
        });

        // Dice roll complete — roller sends back server results after animation
        socket.on("dice-roll-complete", async ({ gameId, diceType, quantity, results, total }) => {
            try {
                const config = DICE_REGISTRY[diceType];
                if (!config) {
                    return socket.emit("error", { message: `Unknown dice type: ${diceType}` });
                }

                if (!Array.isArray(results) || results.length < 1) {
                    return socket.emit("error", { message: "Invalid results" });
                }

                const maxFace = config.faces;
                const valid = results.every((r) => Number.isInteger(r) && r >= 1 && r <= maxFace);
                if (!valid) {
                    return socket.emit("error", { message: "Invalid dice values" });
                }

                const message = await Message.create({
                    gameId,
                    userId: socket.user._id,
                    username: socket.user.username,
                    type: "dice-roll",
                    diceRoll: { diceType, quantity, results, total },
                });

                io.to(`game:${gameId}`).emit("dice-roll-result", {
                    _id: message._id,
                    gameId: message.gameId,
                    userId: message.userId,
                    username: message.username,
                    type: "dice-roll",
                    diceRoll: { diceType, quantity, results, total },
                    createdAt: message.createdAt,
                });
            } catch (err) {
                console.error("[Socket] dice-roll-complete error:", err);
                socket.emit("error", { message: "Failed to save dice roll" });
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.user.username}`);
        });
    });
}
