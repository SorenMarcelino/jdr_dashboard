import CharacterSheetTemplate from "../models/CharacterSheetTemplateModel.mjs";
import CharacterSheetInstance from "../models/CharacterSheetInstanceModel.mjs";
import { Game } from "../models/GameModel.mjs";

// Vérifie que l'utilisateur a accès à la partie (créateur ou joueur)
async function assertGameAccess(gameId, userId) {
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

// GET /character-sheets/templates
export async function getAllTemplates(req, res, next) {
    try {
        const templates = await CharacterSheetTemplate.find({}, "systemId name");
        res.json({ success: true, templates });
    } catch (err) {
        next(err);
    }
}

// GET /character-sheets/templates/:systemId
export async function getTemplateBySystemId(req, res, next) {
    try {
        const template = await CharacterSheetTemplate.findOne({ systemId: req.params.systemId });
        if (!template) return res.status(404).json({ success: false, message: "Template introuvable." });
        res.json({ success: true, template });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/character-sheets  (MJ only)
export async function getAllSheetsForGame(req, res, next) {
    try {
        const { gameId } = req.params;
        const userId = req.user._id;

        const game = await Game.findById(gameId).populate("players", "username email");
        if (!game) return res.status(404).json({ success: false, message: "Partie introuvable." });

        if (game.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Réservé au MJ." });
        }

        const sheets = await CharacterSheetInstance.find({ gameId }).populate("playerId", "username email");
        res.json({ success: true, sheets, players: game.players });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/character-sheets/me
export async function getMySheet(req, res, next) {
    try {
        const { gameId } = req.params;
        const userId = req.user._id;

        await assertGameAccess(gameId, userId);

        const sheet = await CharacterSheetInstance.findOne({ gameId, playerId: userId });
        res.json({ success: true, sheet: sheet || null });
    } catch (err) {
        next(err);
    }
}

// POST /games/:gameId/character-sheets
export async function createSheet(req, res, next) {
    try {
        const { gameId } = req.params;
        const userId = req.user._id;
        const { systemId, values } = req.body;

        await assertGameAccess(gameId, userId);

        const existing = await CharacterSheetInstance.findOne({ gameId, playerId: userId });
        if (existing) {
            return res.status(409).json({ success: false, message: "Vous avez déjà une fiche pour cette partie." });
        }

        const sheet = await CharacterSheetInstance.create({ gameId, playerId: userId, systemId, values: values || {} });
        res.status(201).json({ success: true, sheet });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/character-sheets/:sheetId
export async function updateSheet(req, res, next) {
    try {
        const { gameId, sheetId } = req.params;
        const userId = req.user._id;
        const { values } = req.body;

        await assertGameAccess(gameId, userId);

        const sheet = await CharacterSheetInstance.findById(sheetId);
        if (!sheet) return res.status(404).json({ success: false, message: "Fiche introuvable." });

        const game = await Game.findById(gameId);
        const isMJ = game && game.createdBy.toString() === userId.toString();
        const isOwner = sheet.playerId && sheet.playerId.toString() === userId.toString();

        if (!isMJ && !isOwner) {
            return res.status(403).json({ success: false, message: "Accès refusé." });
        }

        sheet.values = values;
        await sheet.save();

        res.json({ success: true, sheet });
    } catch (err) {
        next(err);
    }
}

// ──────────────────────────────────────
// PNJ (NPC) sheets — MJ only
// ──────────────────────────────────────

async function assertMJ(gameId, userId) {
    const game = await Game.findById(gameId);
    if (!game) {
        const err = new Error("Partie introuvable.");
        err.statusCode = 404;
        throw err;
    }
    if (game.createdBy.toString() !== userId.toString()) {
        const err = new Error("Réservé au MJ.");
        err.statusCode = 403;
        throw err;
    }
    return game;
}

// GET /games/:gameId/npc-sheets
export async function getNpcSheets(req, res, next) {
    try {
        const { gameId } = req.params;
        await assertMJ(gameId, req.user._id);

        const sheets = await CharacterSheetInstance.find({ gameId, isNpc: true });
        res.json({ success: true, sheets });
    } catch (err) {
        next(err);
    }
}

// POST /games/:gameId/npc-sheets
export async function createNpcSheet(req, res, next) {
    try {
        const { gameId } = req.params;
        const { npcName, values } = req.body;

        const game = await assertMJ(gameId, req.user._id);

        if (!npcName || !npcName.trim()) {
            return res.status(400).json({ success: false, message: "Le nom du PNJ est requis." });
        }

        const systemId = req.body.systemId || game.characterSheet;
        const sheet = await CharacterSheetInstance.create({
            gameId,
            playerId: null,
            systemId,
            isNpc: true,
            npcName: npcName.trim(),
            values: values || {},
        });
        res.status(201).json({ success: true, sheet });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/npc-sheets/:sheetId
export async function updateNpcSheet(req, res, next) {
    try {
        const { gameId, sheetId } = req.params;
        const { values, npcName } = req.body;

        await assertMJ(gameId, req.user._id);

        const sheet = await CharacterSheetInstance.findById(sheetId);
        if (!sheet || !sheet.isNpc || sheet.gameId.toString() !== gameId) {
            return res.status(404).json({ success: false, message: "Fiche PNJ introuvable." });
        }

        if (values !== undefined) sheet.values = values;
        if (npcName !== undefined) sheet.npcName = npcName;
        await sheet.save();

        res.json({ success: true, sheet });
    } catch (err) {
        next(err);
    }
}

// DELETE /games/:gameId/npc-sheets/:sheetId
export async function deleteNpcSheet(req, res, next) {
    try {
        const { gameId, sheetId } = req.params;

        await assertMJ(gameId, req.user._id);

        const sheet = await CharacterSheetInstance.findById(sheetId);
        if (!sheet || !sheet.isNpc || sheet.gameId.toString() !== gameId) {
            return res.status(404).json({ success: false, message: "Fiche PNJ introuvable." });
        }

        await sheet.deleteOne();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}
