import express from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.mjs";
import {getAllUsers, searchUsers, updateUserProfile} from "../services/userService.mjs";

const router = express.Router();

// Route protégée - Liste de tous les utilisateurs (nécessite authentification)
router.get("/users", requireAuth, async (req, res) => {
    try {
        const users = await getAllUsers();
        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: false
        });
    }
});

// Route protégée - Obtenir le profil de l'utilisateur connecté
router.get('/profile', requireAuth, async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user // L'utilisateur est attaché par le middleware requireAuth
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        })
    }
});

// Route protégée - Mettre à jour le profil
router.put("/profile", requireAuth, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                message: "Username is required",
                success: false
            });
        }

        const updatedUser = await updateUserProfile(req.user._id, { username });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        const status = error.status || 500;
        return res.status(status).json({
            message: error.message || 'Internal server error',
            success: false
        })
    }
});

router.get("/users/search", requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                message: "Search query is required",
                success: false
            });
        }

        const users = await searchUsers(q);

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error searching users:', error);
        const status = error.status || 500;
        return res.status(status).json({
            message: error.message || 'Internal server error',
            success: false
        });
    }
});

// router.post("/login", requireAuth, async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ message: "No record existed" });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);

//         if (isPasswordValid) {
//             return res.status(200).json({ message: "Successfully logged in" });
//         } else {
//             return res.status(401).json({ message: "The password is incorrect" });
//         }
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// });


export default router;