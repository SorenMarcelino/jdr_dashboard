import { verifyAccessToken } from "../utils/SecretToken.mjs";
import { User } from "../models/UserModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { Message } from "../models/MessageModel.mjs";
import { DICE_REGISTRY, rollDice } from "../config/diceRegistry.mjs";
import logger from "../utils/logger.mjs";

// Longueur maximale d'un message de chat (le canal socket n'est pas couvert par
// la limite de taille d'express.json).
const MAX_MESSAGE_LENGTH = 2000;

// Rate-limiting par socket (token-bucket) : un membre authentifié ne peut pas
// saturer le chat / les jets de dés. Recharge continue ; rafales tolérées.
const RATE_LIMIT_POINTS = 15;       // 15 actions...
const RATE_LIMIT_DURATION_MS = 10000; // ...rechargées sur 10 secondes.

function createRateLimiter() {
    let tokens = RATE_LIMIT_POINTS;
    let last = Date.now();
    return () => {
        const now = Date.now();
        tokens = Math.min(
            RATE_LIMIT_POINTS,
            tokens + ((now - last) / RATE_LIMIT_DURATION_MS) * RATE_LIMIT_POINTS
        );
        last = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    };
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(";").forEach((c) => {
        const [key, ...rest] = c.split("=");
        cookies[key.trim()] = decodeURIComponent(rest.join("="));
    });
    return cookies;
}

// Vérifie que l'utilisateur est membre (créateur ou joueur) de la partie.
// Retourne le document Game, ou null si la partie n'existe pas / accès refusé.
async function getGameIfMember(gameId, userId) {
    if (!gameId) return null;
    let game;
    try {
        game = await Game.findById(gameId);
    } catch {
        // CastError sur un gameId malformé → traité comme accès refusé
        return null;
    }
    if (!game) return null;

    const uid = userId.toString();
    const isMember =
        game.createdBy.toString() === uid ||
        game.players.some((p) => p.toString() === uid);

    return isMember ? game : null;
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
        logger.debug({ user: socket.user.username, userId: socket.user._id }, "[Socket] connected");

        // Limiteur de débit propre à ce socket (libéré à la déconnexion).
        const consumeRate = createRateLimiter();

        // Join a game room
        socket.on("join-game", async (gameId) => {
            try {
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }

                socket.join(`game:${gameId}`);
                socket.emit("joined-game", { gameId });
                logger.debug({ user: socket.user.username, gameId }, "[Socket] joined game");
            } catch (err) {
                logger.error({ err }, "[Socket] join-game error");
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
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                // Contrôle d'appartenance : on ne se fie pas au gameId du payload.
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }

                if (typeof content !== "string") return;
                const trimmed = content.trim();
                if (!trimmed) return;
                if (trimmed.length > MAX_MESSAGE_LENGTH) {
                    return socket.emit("error", {
                        message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
                    });
                }

                const message = await Message.create({
                    gameId,
                    userId: socket.user._id,
                    username: socket.user.username,
                    type: "text",
                    content: trimmed,
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
                logger.error({ err }, "[Socket] chat-message error");
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Dice roll — le serveur génère ET persiste les résultats, puis diffuse
        // l'animation. Les résultats ne sont jamais fournis par le client.
        socket.on("dice-roll", async ({ gameId, diceType, quantity }) => {
            try {
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }

                const config = DICE_REGISTRY[diceType];
                if (!config) {
                    return socket.emit("error", { message: `Unknown dice type: ${diceType}` });
                }

                const qty = Math.max(1, Math.min(quantity || 1, config.maxQuantity));

                // Génération autoritative côté serveur.
                const { results, total } = rollDice(diceType, qty);

                // Persistance immédiate (source de vérité). Le résultat sera
                // diffusé après l'animation via "dice-roll-complete".
                const message = await Message.create({
                    gameId,
                    userId: socket.user._id,
                    username: socket.user.username,
                    type: "dice-roll",
                    diceRoll: { diceType, quantity: qty, results, total },
                });

                // Diffuse le départ de l'animation à TOUS les joueurs, avec les
                // résultats serveur et l'id du message persisté.
                io.to(`game:${gameId}`).emit("dice-roll-start", {
                    messageId: message._id.toString(),
                    gameId,
                    userId: socket.user._id.toString(),
                    username: socket.user.username,
                    diceType,
                    quantity: qty,
                    results,
                    total,
                });
            } catch (err) {
                logger.error({ err }, "[Socket] dice-roll error");
                socket.emit("error", { message: "Failed to start dice roll" });
            }
        });

        // Dice roll complete — le lanceur signale la fin de l'animation. On ne
        // fait confiance qu'à l'id du message déjà persisté côté serveur ; on
        // rediffuse alors le résultat à toute la room pour l'afficher au chat.
        socket.on("dice-roll-complete", async ({ gameId, messageId }) => {
            try {
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }

                const message = await Message.findOne({
                    _id: messageId,
                    gameId,
                    type: "dice-roll",
                });
                if (!message) {
                    return socket.emit("error", { message: "Dice roll not found" });
                }

                io.to(`game:${gameId}`).emit("dice-roll-result", {
                    _id: message._id,
                    gameId: message.gameId,
                    userId: message.userId,
                    username: message.username,
                    type: "dice-roll",
                    diceRoll: message.diceRoll,
                    createdAt: message.createdAt,
                });
            } catch (err) {
                logger.error({ err }, "[Socket] dice-roll-complete error");
                socket.emit("error", { message: "Failed to finalize dice roll" });
            }
        });

        socket.on("disconnect", () => {
            logger.debug({ user: socket.user.username }, "[Socket] disconnected");
        });
    });
}
