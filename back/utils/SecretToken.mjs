import jwt from 'jsonwebtoken';

const getTokenKey = () => {
    const key = process.env.TOKEN_KEY;
    if (!key) {
        console.error('❌ TOKEN_KEY is missing!');
        console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('TOKEN')));
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

    return jwt.sign({ id }, getTokenKey(), { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
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

    return jwt.sign({ id }, getRefreshTokenKey(), { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
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
