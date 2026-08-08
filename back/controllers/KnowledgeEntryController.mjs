import { KnowledgeEntry } from "../models/KnowledgeEntryModel.mjs";
import { assertMJAccess, assertGameAccess } from "../utils/gameAccess.mjs";

function parseType(req) {
    const { type } = req.query;
    if (type !== "rule" && type !== "lore") {
        const err = new Error("Paramètre 'type' invalide (rule ou lore attendu).");
        err.statusCode = 400;
        throw err;
    }
    return type;
}

// GET /games/:gameId/knowledge-entries?type=rule|lore
export async function getAllEntries(req, res, next) {
    try {
        const { gameId } = req.params;
        const type = parseType(req);
        const { isCreator } = await assertGameAccess(gameId, req.user._id);

        const filter = { gameId, type };
        if (!isCreator) filter.visibleToPlayers = true;

        const entries = await KnowledgeEntry.find(
            filter,
            "title category visibleToPlayers order createdAt updatedAt"
        ).sort({ order: 1 });

        res.json({ success: true, entries });
    } catch (err) {
        next(err);
    }
}

// POST /games/:gameId/knowledge-entries
export async function createEntry(req, res, next) {
    try {
        const { gameId } = req.params;
        await assertMJAccess(gameId, req.user._id);
        const { type, title, category } = req.body;

        const lastEntry = await KnowledgeEntry.findOne({ gameId, type }).sort({ order: -1 });
        const order = lastEntry ? lastEntry.order + 1 : 0;

        const entry = await KnowledgeEntry.create({
            gameId,
            type,
            title,
            category: category || "",
            order,
            createdBy: req.user._id,
        });

        res.status(201).json({ success: true, entry });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/knowledge-entries/:entryId
export async function getEntry(req, res, next) {
    try {
        const { gameId, entryId } = req.params;
        const { isCreator } = await assertGameAccess(gameId, req.user._id);

        const entry = await KnowledgeEntry.findOne({ _id: entryId, gameId });
        if (!entry || (!isCreator && !entry.visibleToPlayers)) {
            return res.status(404).json({ success: false, message: "Entrée introuvable." });
        }

        res.json({ success: true, entry });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/knowledge-entries/:entryId
export async function updateEntry(req, res, next) {
    try {
        const { gameId, entryId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const { title, content, category, visibleToPlayers } = req.body;
        const update = {};
        if (title !== undefined) update.title = title;
        if (content !== undefined) update.content = content;
        if (category !== undefined) update.category = category || "";
        if (visibleToPlayers !== undefined) update.visibleToPlayers = visibleToPlayers;

        const entry = await KnowledgeEntry.findOneAndUpdate(
            { _id: entryId, gameId },
            { $set: update },
            { new: true }
        );
        if (!entry) return res.status(404).json({ success: false, message: "Entrée introuvable." });

        res.json({ success: true, entry });
    } catch (err) {
        next(err);
    }
}

// DELETE /games/:gameId/knowledge-entries/:entryId
export async function deleteEntry(req, res, next) {
    try {
        const { gameId, entryId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const entry = await KnowledgeEntry.findOneAndDelete({ _id: entryId, gameId });
        if (!entry) return res.status(404).json({ success: false, message: "Entrée introuvable." });

        res.json({ success: true, message: "Entrée supprimée." });
    } catch (err) {
        next(err);
    }
}

// PATCH /games/:gameId/knowledge-entries/reorder
export async function reorderEntries(req, res, next) {
    try {
        const { gameId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const { type, orders } = req.body;

        const bulkOps = orders.map(({ entryId, order }) => ({
            updateOne: {
                filter: { _id: entryId, gameId, type },
                update: { $set: { order } },
            },
        }));

        await KnowledgeEntry.bulkWrite(bulkOps);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}
