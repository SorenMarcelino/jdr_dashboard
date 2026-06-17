import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import { getAllUsers, searchUsers, updateUserProfile } from "../services/userService.mjs";
import { validate } from "../middlewares/validate.mjs";
import { updateProfileSchema } from "../validation/schemas.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";

const router = express.Router();

// Liste de tous les utilisateurs (authentifié)
router.get("/users", requireAuth, asyncHandler(async (req, res) => {
    const users = await getAllUsers();
    return res.status(200).json({ success: true, users });
}));

// Profil de l'utilisateur connecté
router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user, // attaché par requireAuth
    });
}));

// Mise à jour du profil (username validé par Zod)
router.put("/profile", requireAuth, validate(updateProfileSchema), asyncHandler(async (req, res) => {
    const { username } = req.body;
    const updatedUser = await updateUserProfile(req.user._id, { username });
    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
    });
}));

// Recherche d'utilisateurs
router.get("/users/search", requireAuth, asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: "Search query is required", success: false });
    }
    const users = await searchUsers(q);
    return res.status(200).json({ success: true, users });
}));

export default router;
