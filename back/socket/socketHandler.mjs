import { verifyAccessToken } from "../utils/SecretToken.mjs";
import { User } from "../models/UserModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { Message } from "../models/MessageModel.mjs";
import { GameStage } from "../models/GameStageModel.mjs";
import { TarotSession } from "../models/TarotSessionModel.mjs";
import { DICE_REGISTRY, rollDice } from "../config/diceRegistry.mjs";
import { TAROT_SPREADS, drawCard, getTarotDeck, shuffleDeck } from "../config/tarotRegistry.mjs";
import { tarotMessageFor, tarotStateFor } from "../services/tarotService.mjs";
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

// Vérifie que l'utilisateur est le MJ (créateur) de la partie.
async function getGameIfMJ(gameId, userId) {
    const game = await getGameIfMember(gameId, userId);
    if (!game) return null;
    return game.createdBy.toString() === userId.toString() ? game : null;
}

// Types de média diffusables sur la scène.
const STAGE_KINDS = ["audio", "image", "video", "model3d"];
const MAX_MEDIA_URL_LENGTH = 2048;
const MAX_MEDIA_TITLE_LENGTH = 200;
// Nom d'un PNJ pour qui le MJ tire le tarot.
const MAX_NPC_NAME_LENGTH = 60;

// Valide une URL de média : absolue, http(s), et si MEDIA_ALLOWED_HOSTS est
// renseigné (CSV d'hôtes), l'hôte doit y figurer. Vide (dev) = tout hôte
// http(s) accepté. Retourne l'URL normalisée ou null si refusée.
function validateMediaUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl || rawUrl.length > MAX_MEDIA_URL_LENGTH) {
        return null;
    }
    let url;
    try {
        url = new URL(rawUrl);
    } catch {
        return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const allowedHosts = (process.env.MEDIA_ALLOWED_HOSTS || "")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
    if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname.toLowerCase())) {
        return null;
    }
    return url.toString();
}

// Sérialise l'état de scène envoyé aux clients (event "stage:update").
function stageToPayload(gameId, stage) {
    return {
        gameId: gameId.toString(),
        media: stage?.media
            ? { kind: stage.media.kind, url: stage.media.url, title: stage.media.title }
            : null,
        playback: {
            playing: stage?.playback?.playing ?? false,
            positionSec: stage?.playback?.positionSec ?? 0,
            updatedAtServerMs: stage?.playback?.updatedAtServerMs ?? 0,
        },
    };
}

// Le tarot se diffuse socket par socket : un tirage secret n'est révélé qu'au
// MJ et au tireur (cf. services/tarotService.mjs).
async function emitTarotState(io, game, session) {
    const sockets = await io.in(`game:${game._id}`).fetchSockets();
    for (const s of sockets) {
        s.emit("tarot:state", {
            gameId: game._id.toString(),
            ...tarotStateFor(session, s.data.userId, game.createdBy),
        });
    }
}

async function emitTarotMessage(io, game, message) {
    const sockets = await io.in(`game:${game._id}`).fetchSockets();
    for (const s of sockets) {
        s.emit("chat-message", tarotMessageFor(message, s.data.userId, game.createdBy));
    }
}

const isGameMember = (game, userId) =>
    game.createdBy.toString() === userId.toString() ||
    game.players.some((p) => p.toString() === userId.toString());

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
            // Exposé via fetchSockets() (diffusion du tarot socket par socket).
            socket.data.userId = user._id.toString();
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

                // Late-join : envoie la scène en cours au seul socket qui
                // rejoint, pour qu'il se cale sur la diffusion en cours.
                const stage = await GameStage.findOne({ gameId });
                if (stage?.media) {
                    socket.emit("stage:update", stageToPayload(gameId, stage));
                }

                // Late-join du tarot : la table telle que ce membre peut la voir.
                if (getTarotDeck(game.characterSheet)) {
                    const session = await TarotSession.findOne({ gameId });
                    socket.emit("tarot:state", {
                        gameId: game._id.toString(),
                        ...tarotStateFor(session, socket.user._id, game.createdBy),
                    });
                }
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

        // ── Scène média (diffusion MJ → joueurs) ──────────────────────────

        // Le MJ diffuse un média (par URL externe) à toute la partie.
        socket.on("stage:set", async ({ gameId, kind, url, title }) => {
            try {
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                const game = await getGameIfMJ(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Only the GM can control the stage" });
                }

                if (!STAGE_KINDS.includes(kind)) {
                    return socket.emit("error", { message: "Invalid media kind" });
                }
                const validUrl = validateMediaUrl(url);
                if (!validUrl) {
                    return socket.emit("error", { message: "Invalid or disallowed media URL" });
                }
                const safeTitle =
                    typeof title === "string" ? title.trim().slice(0, MAX_MEDIA_TITLE_LENGTH) : "";

                const stage = await GameStage.findOneAndUpdate(
                    { gameId },
                    {
                        media: { kind, url: validUrl, title: safeTitle },
                        playback: { playing: false, positionSec: 0, updatedAtServerMs: Date.now() },
                        updatedBy: socket.user._id,
                    },
                    { new: true, upsert: true }
                );

                io.to(`game:${gameId}`).emit("stage:update", stageToPayload(gameId, stage));
            } catch (err) {
                logger.error({ err }, "[Socket] stage:set error");
                socket.emit("error", { message: "Failed to set stage media" });
            }
        });

        // Le MJ retire le média en cours (scène vide).
        socket.on("stage:clear", async ({ gameId }) => {
            try {
                const game = await getGameIfMJ(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Only the GM can control the stage" });
                }

                const stage = await GameStage.findOneAndUpdate(
                    { gameId },
                    {
                        media: null,
                        playback: { playing: false, positionSec: 0, updatedAtServerMs: Date.now() },
                        updatedBy: socket.user._id,
                    },
                    { new: true, upsert: true }
                );

                io.to(`game:${gameId}`).emit("stage:update", stageToPayload(gameId, stage));
            } catch (err) {
                logger.error({ err }, "[Socket] stage:clear error");
                socket.emit("error", { message: "Failed to clear stage" });
            }
        });

        // Contrôle de lecture audio/vidéo (play/pause/seek), horodaté par le
        // serveur : les clients se synchronisent sur serverTimeMs.
        socket.on("stage:control", async ({ gameId, action, positionSec }) => {
            try {
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                const game = await getGameIfMJ(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Only the GM can control the stage" });
                }

                if (!["play", "pause", "seek"].includes(action)) {
                    return socket.emit("error", { message: "Invalid stage action" });
                }
                const stage = await GameStage.findOne({ gameId });
                if (!stage?.media) {
                    return socket.emit("error", { message: "No media on stage" });
                }

                const pos =
                    typeof positionSec === "number" && Number.isFinite(positionSec) && positionSec >= 0
                        ? positionSec
                        : stage.playback?.positionSec ?? 0;
                const playing =
                    action === "play" ? true :
                    action === "pause" ? false :
                    stage.playback?.playing ?? false;
                const serverTimeMs = Date.now();

                stage.playback = { playing, positionSec: pos, updatedAtServerMs: serverTimeMs };
                stage.updatedBy = socket.user._id;
                await stage.save();

                io.to(`game:${gameId}`).emit("stage:control", {
                    gameId: gameId.toString(),
                    action,
                    positionSec: pos,
                    playing,
                    serverTimeMs,
                });
            } catch (err) {
                logger.error({ err }, "[Socket] stage:control error");
                socket.emit("error", { message: "Failed to control stage playback" });
            }
        });

        // ── Tarot (tirage accordé par le MJ, lames tirées par le serveur) ──

        // Un panneau qui (re)monte demande l'état courant de la table.
        socket.on("tarot:get", async ({ gameId } = {}) => {
            try {
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game || !getTarotDeck(game.characterSheet)) return;
                const session = await TarotSession.findOne({ gameId });
                socket.emit("tarot:state", {
                    gameId: game._id.toString(),
                    ...tarotStateFor(session, socket.user._id, game.createdBy),
                });
            } catch (err) {
                logger.error({ err }, "[Socket] tarot:get error");
            }
        });

        // Le MJ ouvre un tirage : disposition, inversées, secret et tireur
        // (un joueur, lui-même, ou un PNJ pour qui il tire). Le paquet est
        // mélangé côté serveur ; un nouveau tirage remplace le précédent.
        socket.on("tarot:grant", async ({ gameId, spread, allowReversed, secret, drawerId, npcName } = {}) => {
            try {
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                const game = await getGameIfMJ(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Only the GM can grant a tarot reading" });
                }
                const deck = getTarotDeck(game.characterSheet);
                if (!deck) {
                    return socket.emit("error", { message: "No tarot deck for this game" });
                }
                if (!Object.hasOwn(TAROT_SPREADS, spread)) {
                    return socket.emit("error", { message: "Invalid tarot spread" });
                }
                // PNJ : le MJ retourne les lames, le tirage porte le nom du PNJ.
                const npc = typeof npcName === "string" ? npcName.trim().slice(0, MAX_NPC_NAME_LENGTH) : "";
                let drawer = socket.user;
                if (!npc) {
                    if (typeof drawerId !== "string" || !isGameMember(game, drawerId)) {
                        return socket.emit("error", { message: "The drawer must be a member of this game" });
                    }
                    drawer = await User.findById(drawerId).select("username");
                    if (!drawer) {
                        return socket.emit("error", { message: "Drawer not found" });
                    }
                }

                const session = await TarotSession.findOneAndUpdate(
                    { gameId },
                    {
                        status: "open",
                        spread,
                        allowReversed: allowReversed !== false,
                        secret: secret === true,
                        drawerId: drawer._id,
                        drawerName: npc || drawer.username,
                        npc: !!npc,
                        deck: shuffleDeck(deck),
                        cards: [],
                        messageId: null,
                        grantedBy: socket.user._id,
                    },
                    { new: true, upsert: true }
                );

                await emitTarotState(io, game, session);
            } catch (err) {
                logger.error({ err }, "[Socket] tarot:grant error");
                socket.emit("error", { message: "Failed to grant tarot reading" });
            }
        });

        // Le tireur retourne la lame suivante. Une fois le tirage complet, il
        // est consigné au chat (brouillé pour la table s'il est secret).
        socket.on("tarot:draw", async ({ gameId } = {}) => {
            try {
                if (!consumeRate()) {
                    return socket.emit("error", { message: "Rate limit exceeded, slow down." });
                }
                const game = await getGameIfMember(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Not a member of this game" });
                }
                const session = await TarotSession.findOne({ gameId });
                if (!session || session.status !== "open") {
                    return socket.emit("error", { message: "No tarot reading in progress" });
                }
                if (session.drawerId.toString() !== socket.user._id.toString()) {
                    return socket.emit("error", { message: "Only the designated player can draw" });
                }

                const total = TAROT_SPREADS[session.spread];
                const drawn = drawCard(session.deck, session.allowReversed);
                if (!drawn || session.cards.length >= total) return;

                const complete = session.cards.length + 1 === total;
                // Mise à jour conditionnée au nombre de lames déjà tirées : deux
                // clics simultanés ne tirent pas deux fois la même place.
                const updated = await TarotSession.findOneAndUpdate(
                    { _id: session._id, status: "open", cards: { $size: session.cards.length } },
                    {
                        $set: { deck: drawn.deck, ...(complete ? { status: "done" } : {}) },
                        $push: { cards: drawn.card },
                    },
                    { new: true }
                );
                if (!updated) return;

                if (complete) {
                    const message = await Message.create({
                        gameId,
                        userId: socket.user._id,
                        username: socket.user.username,
                        type: "tarot",
                        tarot: {
                            spread: updated.spread,
                            secret: updated.secret,
                            drawerId: updated.drawerId,
                            drawerName: updated.drawerName,
                            npc: updated.npc,
                            cards: updated.cards,
                        },
                    });
                    updated.messageId = message._id;
                    await updated.save();
                    await emitTarotMessage(io, game, message.toObject());
                }

                await emitTarotState(io, game, updated);
            } catch (err) {
                logger.error({ err }, "[Socket] tarot:draw error");
                socket.emit("error", { message: "Failed to draw a card" });
            }
        });

        // Le MJ ramasse les lames : la table redevient vide.
        socket.on("tarot:reset", async ({ gameId } = {}) => {
            try {
                const game = await getGameIfMJ(gameId, socket.user._id);
                if (!game) {
                    return socket.emit("error", { message: "Only the GM can reset the tarot table" });
                }
                await TarotSession.deleteOne({ gameId });
                await emitTarotState(io, game, null);
            } catch (err) {
                logger.error({ err }, "[Socket] tarot:reset error");
                socket.emit("error", { message: "Failed to reset the tarot table" });
            }
        });

        socket.on("disconnect", () => {
            logger.debug({ user: socket.user.username }, "[Socket] disconnected");
        });
    });
}
