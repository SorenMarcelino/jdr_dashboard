import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { createGame, getUserGames, getGameById, joinGame } from "../controllers/GameController.mjs";
import { gameSheetRouter } from "./CharacterSheetRoute.mjs";
import { chatRouter } from "./ChatRoute.mjs";
import { scenarioRouter } from "./ScenarioRoute.mjs";
import { validate } from "../middlewares/validate.mjs";
import { createGameSchema, joinGameSchema } from "../validation/schemas.mjs";

const router = express.Router();

router.post("/create", requireAuth, validate(createGameSchema), createGame);
router.post("/join", requireAuth, validate(joinGameSchema), joinGame);
router.get("/", requireAuth, getUserGames);
router.get("/:gameId", requireAuth, getGameById);

// Routes fiches personnage pour une partie
router.use("/:gameId", gameSheetRouter);

// Routes chat / messages pour une partie
router.use("/:gameId", chatRouter);

// Routes scénarios pour une partie
router.use("/:gameId", scenarioRouter);

export default router;
