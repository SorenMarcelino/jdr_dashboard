import {createAccessToken, createRefreshToken, verifyRefreshToken} from '../utils/SecretToken.mjs';
import { validateEmail } from '../utils/validators.mjs';
import { findUserByEmail, registerUser, verifyPassword } from "../services/authService.mjs";
import {User} from "../models/UserModel.mjs";

const { NODE_ENV } = process.env;

export const Signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validation des champs requis
        if (!email || !password || !username) {
            return res.status(400).json({ message: 'All fields are required.', success: false });
        }

        // Validation
        const user = await registerUser(email, password, username);

        // Création des tokens
        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);

        // Sauvegarde du refresh token en DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Configuration du token sécurisé
        res.cookie("accessToken", accessToken, {
            httpOnly: true, // Protection XSS
            secure: NODE_ENV === 'production', // HTTPS uniquement en production
            sameSite: 'strict', // Protecton CSRF
            maxAge: 30 * 60 * 1000, // 30 minutes
            //withCredentials: true,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Protection XSS
            secure: NODE_ENV === 'production', // HTTPS uniquement en production
            sameSite: 'strict', // Protecton CSRF
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 jours
            path: '/auth/refresh',
            //withCredentials: true,
        });

        res.status(201).json({
            message: "User signed in successfully",
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);

        const status = error.status || 500;
        const message = error.message || 'Internal server error';

        res.status(status).json({
            message: message,
            success: false
        });
    }
};

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des champs requis
        if(!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format",
                success: false
            });
        }

        // Recherche de l'utilisateur
        const user = await findUserByEmail(email);
        await verifyPassword(user, password);

        // Création des tokens
        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);

        // Sauvegarde du refresh token en DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Configuration du cookie sécurisé
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000, // 30 minutes
            // withCredentials: true
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
            path: '/auth/refresh',
            // withCredentials: true
        });

        res.status(200).json({
            message: "Successfully logged in",
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Internal server error",
            success: false
        });
    }
};

export const RefreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token not found',
                success: false
            });
        }

        // Vérifie le JWT refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                message: 'Invalid or expired refresh token',
                success: false
            });
        }

        // Vérifie que le refresh token existe en DB
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                message: 'Invalid refresh token',
                success: false
            });
        }

        // Refresh token rotation
        const newAccessToken = createAccessToken(user._id);
        const newRefreshToken = createRefreshToken(user._id);

        // Sauvegarde le nouveau refresh token
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Renvoie les nouveaux tokens
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 14 * 24 * 60 * 60 * 1000,
            path: '/auth/refresh',
        });

        res.status(200).json({
            message: "Token refreshed successfully",
            success: true
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            message: "Refresh token error : " + error,
            success: false
        })
    }
}

export const Logout = async (req, res) => {
    try {
        // Révoque le refresh token en DB
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded) {
                await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
            }
        }

        // Supprime les cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh'
        });

        res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.log("Logout error:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
