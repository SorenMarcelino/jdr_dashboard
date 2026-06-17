import {createAccessToken, createRefreshToken, verifyRefreshToken, hashToken} from '../utils/SecretToken.mjs';
import { findUserByEmail, registerUser, verifyPassword } from "../services/authService.mjs";
import {User} from "../models/UserModel.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import {
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
    clearAccessTokenCookieOptions,
    clearRefreshTokenCookieOptions,
} from "../utils/cookies.mjs";

// Les champs (email, username, password) sont validés en amont par Zod
// (signupSchema / loginSchema) via le middleware `validate`.

export const Signup = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    const user = await registerUser(email, password, username);

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    // Sauvegarde du refresh token (haché) en DB
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Pose des cookies sécurisés
    res.cookie("accessToken", accessToken, accessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());

    res.status(201).json({
        message: "User signed in successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
});

export const Login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    await verifyPassword(user, password);

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    // Sauvegarde du refresh token (haché) en DB
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Pose des cookies sécurisés
    res.cookie("accessToken", accessToken, accessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());

    res.status(200).json({
        message: "Successfully logged in",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
});

export const RefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found', success: false });
    }

    // Vérifie le JWT refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired refresh token', success: false });
    }

    // Vérifie que le refresh token correspond bien à celui stocké en DB (haché)
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== hashToken(refreshToken)) {
        return res.status(401).json({ message: 'Invalid refresh token', success: false });
    }

    // Rotation du refresh token
    const newAccessToken = createAccessToken(user._id);
    const newRefreshToken = createRefreshToken(user._id);

    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.cookie("accessToken", newAccessToken, accessTokenCookieOptions());
    res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions());

    res.status(200).json({ message: "Token refreshed successfully", success: true });
});

export const Logout = asyncHandler(async (req, res) => {
    // Révoque le refresh token en DB
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded) {
            await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
        }
    }

    // Supprime les cookies
    res.clearCookie('accessToken', clearAccessTokenCookieOptions());
    res.clearCookie('refreshToken', clearRefreshTokenCookieOptions());

    res.status(200).json({ message: "Logged out successfully", success: true });
});
