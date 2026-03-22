import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import {
    getAllTemplates,
    getTemplateBySystemId,
    getAllSheetsForGame,
    getMySheet,
    createSheet,
    updateSheet,
} from "../controllers/CharacterSheetController.mjs";

const router = express.Router();

// Templates
router.get("/templates", requireAuth, getAllTemplates);
router.get("/templates/:systemId", requireAuth, getTemplateBySystemId);

export default router;

// Routes imbriquées dans /games/:gameId — exportées séparément pour montage dans GamesRoute
export const gameSheetRouter = express.Router({ mergeParams: true });
gameSheetRouter.get("/character-sheets", requireAuth, getAllSheetsForGame);
gameSheetRouter.get("/character-sheets/me", requireAuth, getMySheet);
gameSheetRouter.post("/character-sheets", requireAuth, createSheet);
gameSheetRouter.put("/character-sheets/:sheetId", requireAuth, updateSheet);
