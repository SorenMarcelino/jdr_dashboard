import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import {
    getAllScenarios,
    createScenario,
    getScenario,
    updateScenario,
    deleteScenario,
    getAllPages,
    createPage,
    getPage,
    updatePage,
    deletePage,
    getGraphData,
    updatePagePositions,
} from "../controllers/ScenarioController.mjs";

// Routes imbriquées dans /games/:gameId — exportées pour montage dans GamesRoute
export const scenarioRouter = express.Router({ mergeParams: true });

// Scénarios
scenarioRouter.get("/scenarios", requireAuth, getAllScenarios);
scenarioRouter.post("/scenarios", requireAuth, createScenario);
scenarioRouter.get("/scenarios/:scenarioId", requireAuth, getScenario);
scenarioRouter.put("/scenarios/:scenarioId", requireAuth, updateScenario);
scenarioRouter.delete("/scenarios/:scenarioId", requireAuth, deleteScenario);

// Pages
scenarioRouter.get("/scenarios/:scenarioId/pages", requireAuth, getAllPages);
scenarioRouter.post("/scenarios/:scenarioId/pages", requireAuth, createPage);
scenarioRouter.get("/scenarios/:scenarioId/pages/:pageId", requireAuth, getPage);
scenarioRouter.put("/scenarios/:scenarioId/pages/:pageId", requireAuth, updatePage);
scenarioRouter.delete("/scenarios/:scenarioId/pages/:pageId", requireAuth, deletePage);

// Graph
scenarioRouter.get("/scenarios/:scenarioId/graph", requireAuth, getGraphData);
scenarioRouter.put("/scenarios/:scenarioId/positions", requireAuth, updatePagePositions);
