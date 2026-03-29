import { Scenario } from "../models/ScenarioModel.mjs";
import ScenarioPage from "../models/ScenarioPageModel.mjs";
import { Game } from "../models/GameModel.mjs";
import { extractScenarioLinks } from "../utils/extractScenarioLinks.mjs";

// Vérifie que l'utilisateur est le MJ de la partie
async function assertMJAccess(gameId, userId) {
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

// GET /games/:gameId/scenarios
export async function getAllScenarios(req, res, next) {
    try {
        const { gameId } = req.params;
        await assertMJAccess(gameId, req.user._id);
        const scenarios = await Scenario.find({ gameId }, "title description entryPageId currentPageId createdAt");
        res.json({ success: true, scenarios });
    } catch (err) {
        next(err);
    }
}

// POST /games/:gameId/scenarios
export async function createScenario(req, res, next) {
    try {
        const { gameId } = req.params;
        await assertMJAccess(gameId, req.user._id);
        const { title, description } = req.body;

        const scenario = await Scenario.create({
            gameId,
            title,
            description: description || "",
            createdBy: req.user._id,
        });

        // Crée une première page vierge comme point d'entrée
        const firstPage = await ScenarioPage.create({
            scenarioId: scenario._id,
            title: "Introduction",
            order: 0,
        });

        scenario.entryPageId = firstPage._id;
        scenario.currentPageId = firstPage._id;
        await scenario.save();

        res.status(201).json({ success: true, scenario, firstPage });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/scenarios/:scenarioId
export async function getScenario(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const scenario = await Scenario.findOne({ _id: scenarioId, gameId });
        if (!scenario) return res.status(404).json({ success: false, message: "Scénario introuvable." });

        const pages = await ScenarioPage.find({ scenarioId }, "title order tags position outgoingLinks createdAt").sort({ order: 1 });
        res.json({ success: true, scenario, pages });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/scenarios/:scenarioId
export async function updateScenario(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const { title, description, currentPageId, entryPageId } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (currentPageId !== undefined) updates.currentPageId = currentPageId;
        if (entryPageId !== undefined) updates.entryPageId = entryPageId;

        const scenario = await Scenario.findOneAndUpdate(
            { _id: scenarioId, gameId },
            updates,
            { new: true }
        );
        if (!scenario) return res.status(404).json({ success: false, message: "Scénario introuvable." });

        res.json({ success: true, scenario });
    } catch (err) {
        next(err);
    }
}

// DELETE /games/:gameId/scenarios/:scenarioId
export async function deleteScenario(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const scenario = await Scenario.findOneAndDelete({ _id: scenarioId, gameId });
        if (!scenario) return res.status(404).json({ success: false, message: "Scénario introuvable." });

        await ScenarioPage.deleteMany({ scenarioId });
        res.json({ success: true, message: "Scénario supprimé." });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/scenarios/:scenarioId/pages
export async function getAllPages(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const pages = await ScenarioPage.find({ scenarioId }).sort({ order: 1 });
        res.json({ success: true, pages });
    } catch (err) {
        next(err);
    }
}

// POST /games/:gameId/scenarios/:scenarioId/pages
export async function createPage(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const scenario = await Scenario.findOne({ _id: scenarioId, gameId });
        if (!scenario) return res.status(404).json({ success: false, message: "Scénario introuvable." });

        const { title, tags } = req.body;
        const lastPage = await ScenarioPage.findOne({ scenarioId }).sort({ order: -1 });
        const order = lastPage ? lastPage.order + 1 : 0;

        const page = await ScenarioPage.create({
            scenarioId,
            title: title || "Nouvelle page",
            tags: tags || [],
            order,
        });

        res.status(201).json({ success: true, page });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/scenarios/:scenarioId/pages/:pageId
export async function getPage(req, res, next) {
    try {
        const { gameId, scenarioId, pageId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const page = await ScenarioPage.findOne({ _id: pageId, scenarioId });
        if (!page) return res.status(404).json({ success: false, message: "Page introuvable." });

        res.json({ success: true, page });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/scenarios/:scenarioId/pages/:pageId
export async function updatePage(req, res, next) {
    try {
        const { gameId, scenarioId, pageId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const page = await ScenarioPage.findOne({ _id: pageId, scenarioId });
        if (!page) return res.status(404).json({ success: false, message: "Page introuvable." });

        const { title, content, tags, position, order } = req.body;

        if (title !== undefined) page.title = title;
        if (tags !== undefined) page.tags = tags;
        if (position !== undefined) page.position = position;
        if (order !== undefined) page.order = order;

        if (content !== undefined) {
            page.content = content;
            page.outgoingLinks = extractScenarioLinks(content);
        }

        await page.save();
        res.json({ success: true, page });
    } catch (err) {
        next(err);
    }
}

// DELETE /games/:gameId/scenarios/:scenarioId/pages/:pageId
export async function deletePage(req, res, next) {
    try {
        const { gameId, scenarioId, pageId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const page = await ScenarioPage.findOneAndDelete({ _id: pageId, scenarioId });
        if (!page) return res.status(404).json({ success: false, message: "Page introuvable." });

        // Nettoyer les outgoingLinks des autres pages qui pointent vers cette page
        await ScenarioPage.updateMany(
            { scenarioId, "outgoingLinks.targetPageId": pageId },
            { $pull: { outgoingLinks: { targetPageId: pageId } } }
        );

        // Si c'était la page d'entrée, reset
        await Scenario.updateOne(
            { _id: scenarioId, entryPageId: pageId },
            { $set: { entryPageId: null } }
        );
        await Scenario.updateOne(
            { _id: scenarioId, currentPageId: pageId },
            { $set: { currentPageId: null } }
        );

        res.json({ success: true, message: "Page supprimée." });
    } catch (err) {
        next(err);
    }
}

// GET /games/:gameId/scenarios/:scenarioId/graph
export async function getGraphData(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const scenario = await Scenario.findOne({ _id: scenarioId, gameId }, "entryPageId currentPageId");
        if (!scenario) return res.status(404).json({ success: false, message: "Scénario introuvable." });

        const pages = await ScenarioPage.find(
            { scenarioId },
            "_id title position outgoingLinks tags"
        ).lean();

        res.json({
            success: true,
            entryPageId: scenario.entryPageId,
            currentPageId: scenario.currentPageId,
            pages,
        });
    } catch (err) {
        next(err);
    }
}

// PUT /games/:gameId/scenarios/:scenarioId/positions
export async function updatePagePositions(req, res, next) {
    try {
        const { gameId, scenarioId } = req.params;
        await assertMJAccess(gameId, req.user._id);

        const { positions } = req.body; // [{ pageId, position: { x, y } }]
        if (!Array.isArray(positions)) {
            return res.status(400).json({ success: false, message: "Format invalide." });
        }

        const bulkOps = positions.map(({ pageId, position }) => ({
            updateOne: {
                filter: { _id: pageId, scenarioId },
                update: { $set: { position } },
            },
        }));

        await ScenarioPage.bulkWrite(bulkOps);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}
