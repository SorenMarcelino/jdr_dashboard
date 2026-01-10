import { Login, Signup, Logout } from "../controllers/AuthController.mjs";
import express from 'express';
import { userVerification } from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.post("/verify", userVerification);

export default router;