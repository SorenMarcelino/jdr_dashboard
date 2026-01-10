import jwt from 'jsonwebtoken';

export const createSecretToken = (id) => {
    if (!id) {
        throw new Error('User ID is required to create secret token');
    }

    const TOKEN_KEY = process.env.TOKEN_KEY;

    if (!TOKEN_KEY) {
        throw new Error('TOKEN_KEY environment variable is not set');
    }

    return jwt.sign({ id }, TOKEN_KEY, {
        expiresIn: '3d', // 3 jours
    });
};

export const verifyToken = (token) => {
    try {
        const TOKEN_KEY = process.env.TOKEN_KEY;

        if (!TOKEN_KEY) {
            throw new Error('TOKEN_KEY environment variable is not set');
        }

        return jwt.verify(token, TOKEN_KEY);
    } catch (error) {
        return null;
    }
};