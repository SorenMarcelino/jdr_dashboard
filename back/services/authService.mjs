import {validateEmail, validatePassword} from "../utils/validators.mjs";
import {User} from '../models/UserModel.mjs';
import bcrypt from "bcryptjs";

export const registerUser = async (email, password, username) => {
    if (!validateEmail(email)) {
        const error = new Error('Invalid email format');
        error.status = 400;
        throw error;
    }

    // Validation password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        const error = new Error(passwordValidation.message);
        error.status = 400;
        throw error;
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({email});
    if (existingUser) {
        const error = new Error('User already exists');
        error.status = 409;
        throw error;
    }

    return await User.create({email, password, username});
};

/**
 * Trouver un utilisateur par email
 */
export const findUserByEmail = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }
    return user;
};

/**
 * Vérifier le mot de passe
 */
export const verifyPassword = async (user, password) => {
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }
    return true;
};
