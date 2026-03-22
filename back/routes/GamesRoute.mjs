import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { createGame, getUserGames, joinGame } from "../controllers/GameController.mjs";

const router = express.Router();

router.post("/create", requireAuth, createGame);
router.post("/join", requireAuth, joinGame);
router.get("/", requireAuth, getUserGames);

export default router;
