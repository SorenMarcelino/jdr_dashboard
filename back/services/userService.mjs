import {User} from '../models/UserModel.mjs';

/**
 * Récupérer tous les utilisateurs (sans mots de passe)
 */
export const getAllUsers = async () => {
    return User.find({}).select('-password');
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return user;
}

export const updateUserProfile = async (userId, updates) => {
    const allowedUpdates = ['username'];
    const updateKeys = Object.keys(updates);

    const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));

    if (!isValidUpdate) {
        const error = new Error('Invalid updates. Only username can be updated.');
        error.status = 400;
        throw error;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return updatedUser;
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return user;
};

// Échappe les métacaractères regex pour éviter l'injection de motif / ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Rechercher les utilisateurs par critères
 */
export const searchUsers = async (searchTerm) => {
    const safe = escapeRegex(String(searchTerm).trim());
    if (!safe) return [];
    return await User.find({
        $or: [
            {username: {$regex: safe, $options: 'i'}},
            {email: {$regex: safe, $options: 'i'}}
        ]
    }).select('-password').limit(20);
};

export const MAX_SAVED_COLORS = 24;

/**
 * Normalise les couleurs de la palette : minuscules, #rgb → #rrggbb,
 * valeurs invalides ignorées, doublons retirés (la première occurrence
 * gagne), 24 au plus.
 */
export const normalizeSavedColors = (colors) => {
    const unique = new Set();
    for (const raw of colors) {
        let hex = String(raw).trim().toLowerCase();
        if (/^#[0-9a-f]{3}$/.test(hex)) {
            hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
        }
        if (/^#[0-9a-f]{6}$/.test(hex)) unique.add(hex);
    }
    return [...unique].slice(0, MAX_SAVED_COLORS);
};

/**
 * Couleurs sauvegardées de l'utilisateur
 */
export const getSavedColors = async (userId) => {
    const user = await User.findById(userId).select('savedColors');

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return [...user.savedColors];
};

/**
 * Remplace les couleurs sauvegardées de l'utilisateur
 */
export const setSavedColors = async (userId, colors) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { savedColors: normalizeSavedColors(colors) },
        { new: true, runValidators: true }
    ).select('savedColors');

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return [...user.savedColors];
};

