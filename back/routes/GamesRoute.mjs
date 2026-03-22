import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { createGame, getUserGames, joinGame } from "../controllers/GameController.mjs";
import { gameSheetRouter } from "./CharacterSheetRoute.mjs";

const router = express.Router();

router.post("/create", requireAuth, createGame);
router.post("/join", requireAuth, joinGame);
router.get("/", requireAuth, getUserGames);

// Routes fiches personnage pour une partie
router.use("/:gameId", gameSheetRouter);

export default router;
