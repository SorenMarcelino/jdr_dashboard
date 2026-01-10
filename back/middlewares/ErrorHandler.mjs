export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Erreur de validation Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    // Erreur de duplication (clé unique)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Erreur CastError (ID invalide)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ID format`
        });
    }

    // Erreur JWT
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

    // Erreur par défaut
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
}