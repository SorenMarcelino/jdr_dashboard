import {Login, Signup} from "../controllers/AuthController.mjs";
import express from 'express';
import {userVerification} from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/", userVerification);

export default router;