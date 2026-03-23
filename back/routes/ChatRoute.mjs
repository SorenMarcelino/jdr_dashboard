import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { getMessages } from "../controllers/ChatController.mjs";

export const chatRouter = express.Router({ mergeParams: true });

chatRouter.get("/messages", requireAuth, getMessages);
