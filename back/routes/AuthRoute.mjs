import {Login, Signup, Logout, RefreshToken} from "../controllers/AuthController.mjs";
import express from 'express';
import { userVerification } from "../middlewares/AuthMiddleware.mjs";
import { validate } from "../middlewares/validate.mjs";
import { signupSchema, loginSchema } from "../validation/schemas.mjs";

const router = express.Router();

router.post("/signup", validate(signupSchema), Signup);
router.post("/login", validate(loginSchema), Login);
router.post("/logout", Logout);
router.post("/verify", userVerification);
router.post("/refresh", RefreshToken);

export default router;