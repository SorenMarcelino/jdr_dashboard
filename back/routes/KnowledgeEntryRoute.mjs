import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import {
    getAllEntries,
    createEntry,
    getEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
} from "../controllers/KnowledgeEntryController.mjs";
import { validate } from "../middlewares/validate.mjs";
import {
    createKnowledgeEntrySchema,
    updateKnowledgeEntrySchema,
    reorderKnowledgeEntriesSchema,
} from "../validation/schemas.mjs";

// Routes imbriquées dans /games/:gameId — exportées pour montage dans GamesRoute
export const knowledgeEntryRouter = express.Router({ mergeParams: true });

knowledgeEntryRouter.get("/knowledge-entries", requireAuth, getAllEntries);
knowledgeEntryRouter.post("/knowledge-entries", requireAuth, validate(createKnowledgeEntrySchema), createEntry);
knowledgeEntryRouter.get("/knowledge-entries/:entryId", requireAuth, getEntry);
knowledgeEntryRouter.put("/knowledge-entries/:entryId", requireAuth, validate(updateKnowledgeEntrySchema), updateEntry);
knowledgeEntryRouter.delete("/knowledge-entries/:entryId", requireAuth, deleteEntry);
knowledgeEntryRouter.patch("/knowledge-entries/reorder", requireAuth, validate(reorderKnowledgeEntriesSchema), reorderEntries);
