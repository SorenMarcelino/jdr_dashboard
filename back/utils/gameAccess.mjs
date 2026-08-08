import { Game } from "../models/GameModel.mjs";

// Vérifie que l'utilisateur est le MJ de la partie
export async function assertMJAccess(gameId, userId) {
    const game = await Game.findById(gameId);
    if (!game) {
        const err = new Error("Partie introuvable.");
        err.statusCode = 404;
        throw err;
    }
    if (game.createdBy.toString() !== userId.toString()) {
        const err = new Error("Réservé au Maître du Jeu.");
        err.statusCode = 403;
        throw err;
    }
    return game;
}

// Vérifie que l'utilisateur a accès à la partie (créateur ou joueur)
export async function assertGameAccess(gameId, userId) {
    const game = await Game.findById(gameId);
    if (!game) {
        const err = new Error("Partie introuvable.");
        err.statusCode = 404;
        throw err;
    }
    const isCreator = game.createdBy.toString() === userId.toString();
    const isPlayer = game.players.some((p) => p.toString() === userId.toString());
    if (!isCreator && !isPlayer) {
        const err = new Error("Accès refusé à cette partie.");
        err.statusCode = 403;
        throw err;
    }
    return { game, isCreator };
}
