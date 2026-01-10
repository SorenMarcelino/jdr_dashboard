import  { User } from '../models/UserModel.mjs';
import { createSecretToken } from '../utils/SecretToken.mjs';
import bcrypt from 'bcryptjs';
import { validateEmail, validatePassword } from '../utils/validators.mjs';

const { NODE_ENV } = process.env;

export const Signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validation des champs requis
        if (!email || !password || !username) {
            return res.status(400).json({
                message: 'All fields are required.',
                success: false
            });
        }

        // Validation du format email
        if (!validateEmail(email)) {
            return res.status(400).json({
                message: 'Invalid email format',
                success: false
            });
        }

        // Validation de la complexité du mot de passe
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                message: passwordValidation.message,
                success: false
            });
        }

        // Vérification si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "User already exist",
                success: false
            });
        }

        // Création de l'utilisateur
        const user = await User.create({
            email,
            password,
            username,
            createdAt: new Date()
        });

        // Création du token
        const token = createSecretToken(user._id);

        // Configuration du token sécurisé
        res.cookie("token", token, {
            httpOnly: true, // Protection XSS
            secure: NODE_ENV === 'production', // HTTPS uniquement en production
            sameSite: 'strict', // Protecton CSRF
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 jours
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
        res.status(500).json({
            message: 'Internal server error',
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

        // Validation du format email
        if (!validateEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format",
                success: false
            });
        }

        // Recherche de l'utilisateur
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false
            });
        }

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false
            });
        }

        // Création du token
        const token = createSecretToken(user._id);

        // Configuration du cookie sécurisé
        res.cookie("token", token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000,
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
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const Logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
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
