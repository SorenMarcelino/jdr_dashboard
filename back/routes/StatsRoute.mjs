import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { getGameStats } from "../controllers/StatsController.mjs";

export const statsRouter = express.Router({ mergeParams: true });

statsRouter.get("/stats", requireAuth, getGameStats);
