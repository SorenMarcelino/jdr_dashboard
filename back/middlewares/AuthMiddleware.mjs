import { User } from '../models/UserModel.mjs';
import jwt from 'jsonwebtoken';

// const { TOKEN_KEY } = process.env;

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
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: 'Authentification required',
                success: false
            });
        }

        const TOKEN_KEY = process.env.TOKEN_KEY;

        jwt.verify(token, TOKEN_KEY, async (err, data) => {
            if (err) {
                return res.status(401).json({
                    message: 'Invalid or expired token',
                    success: false
                });
            }

            try {
                const user = await User.findById(data.id).select('-password');

                if (!user) {
                    return res.status(401).json({
                        message: 'User not found',
                        success: false
                    });
                }

                req.user = user; // Attacher l'utilisateur à la requête
                next();
            } catch (dbError) {
                console.error('Database error in requireAuth:', dbError);
                return res.status(500).json({
                    message: 'Internal server error',
                    success: false
                });
            }
        });
    } catch (error) {
        console.error('Error in requireAuth:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};