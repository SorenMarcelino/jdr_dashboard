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



