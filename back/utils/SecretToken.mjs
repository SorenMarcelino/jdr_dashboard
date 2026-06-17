import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

// Hash du refresh token avant stockage en DB. Le token étant un JWT à haute
// entropie (pas un mot de passe), un SHA-256 sans sel suffit : en cas de fuite
// de la base, les tokens stockés ne sont pas rejouables.
export const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

const getTokenKey = () => {
    const key = process.env.TOKEN_KEY;
    if (!key) {
        throw new Error('TOKEN_KEY is required');
    }
    return key;
};

const getRefreshTokenKey = () => {
    const key = process.env.REFRESH_TOKEN_KEY;
    if (!key) {
        throw new Error('REFRESH_TOKEN_KEY is required');
    }
    return key;
};

// Access token (durée configurable)
export const createAccessToken = (id) => {
    if (!id) throw new Error('User ID is required');

    return jwt.sign({ id }, getTokenKey(), { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY) || 1800 });
}

// Check Access Token
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, getTokenKey());
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            const error = new Error('Access token expired');
            error.code = 'TOKEN_EXPIRED';  // ← Le test vérifie ce code!
            error.status = 401;
            throw error;
        }
        return null;
    }
}

// Refresh token (14 days)
export const createRefreshToken = (id) => {
    if (!id) throw new Error('User ID is required');

    return jwt.sign({ id }, getRefreshTokenKey(), { expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 1209600 });
}

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, getRefreshTokenKey());
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            const error = new Error('Refresh token expired');
            error.code = 'REFRESH_TOKEN_EXPIRED';
            error.status = 401;
            throw error;
        }

        return null;
    }
}
