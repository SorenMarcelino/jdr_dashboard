import logger from "../utils/logger.mjs";

export const errorHandler = (err, req, res, next) => {
    logger.error({ err, path: req.originalUrl, method: req.method }, "Request error");

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    const status = err.status || err.statusCode || 500;

    // En production, on ne divulgue pas les détails internes des erreurs 500.
    const isProd = process.env.NODE_ENV === 'production';
    const message =
        status >= 500 && isProd
            ? 'Internal server error'
            : err.message || 'Internal server error';

    res.status(status).json({
        success: false,
        message
    });
};
