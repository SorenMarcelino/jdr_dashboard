import { User } from '../models/UserModel.mjs';
import jwt from 'jsonwebtoken';
import {verifyAccessToken} from "../utils/SecretToken.mjs";

export const userVerification = (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({status: false, message: 'No token provided'});
        }

        const TOKEN_KEY = process.env.TOKEN_KEY;

        jwt.verify(token, TOKEN_KEY, async (err, data) => {
            if (err) {
                return res.json({ status: false, message: 'Invalid or expired token'});
            }

            try {
                const user = await User.findById(data.id).select('-password'); // Exclure le password

                if (user) {
                    return res.json({
                        status: true,
                        user: {
                            id: user._id,
                            username: user.username,
                            email: user.email
                        }
                    });
                } else {
                    return res.json({ status: false, message: 'User not found'});
                }
            } catch (dbError) {
                console.error('Database error in userVerification:', dbError);
                return res.status(500).json({
                    status: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in userVerification:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
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

        const user = await User.findById(decoded.id).select('-password-refreshToken');
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

        console.error('Error in requireAuth:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};