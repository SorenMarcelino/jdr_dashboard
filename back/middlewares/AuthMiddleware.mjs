import { User } from '../models/UserModel.mjs';
import { verifyAccessToken } from "../utils/SecretToken.mjs";
import logger from "../utils/logger.mjs";

export const userVerification = async (req, res) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ status: false, message: 'No token provided' });
        }

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            // Token expiré (code TOKEN_EXPIRED levé par verifyAccessToken)
            return res.status(401).json({ status: false, message: 'Invalid or expired token' });
        }
        if (!decoded) {
            return res.status(401).json({ status: false, message: 'Invalid or expired token' });
        }

        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (!user) {
            return res.status(401).json({ status: false, message: 'User not found' });
        }

        return res.json({
            status: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        logger.error({ err: error }, 'Error in userVerification');
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// Middleware pour protéger les routes
export const requireAuth = async (req, res, next) => {
    try {
        const { accessToken } = req.cookies;

        if (!accessToken) {
            return res.status(401).json({
                message: 'Access token required',
                success: false
            });
        }

        const decoded = verifyAccessToken(accessToken);
        if (!decoded) {
            return res.status(401).json({
                message: 'Invalid or expired access token',
                success: false,
                code: 'TOKEN_EXPIRED'
            });
        }

        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                success: false
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.code === 'TOKEN_EXPIRED') {
            return res.status(401).json({
                message: 'Invalid or expired access token',
                success: false,
                code: 'TOKEN_EXPIRED'
            });
        }

        logger.error({ err: error }, 'Error in requireAuth');
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};