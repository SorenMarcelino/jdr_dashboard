import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { verifyAccessToken } from '../utils/SecretToken.mjs';

// Id de l'utilisateur si l'access token est valide (signature ET expiration),
// sinon null. Un token forgé ou expiré ne doit pas ouvrir un quota à part :
// il retombe sur le compteur de l'IP.
const authenticatedUserId = (req) => {
    const token = req.cookies?.accessToken;
    if (!token) return null;
    try {
        return verifyAccessToken(token)?.id ?? null;
    } catch {
        return null; // expiré
    }
};

// Clé du compteur global : par utilisateur quand il est connecté, par IP
// sinon. Compter uniquement par IP bloquait toute une table de joueurs
// connectés depuis la même box (même IP publique) : ils partageaient 100
// requêtes / 15 min, puis /auth/verify répondait 429 et tout le monde
// paraissait déconnecté, re-login compris.
export const rateLimitKey = (req) => {
    const userId = authenticatedUserId(req);
    return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip)}`;
};

// Limiter global. Les routes d'auth ont leur limiter dédié (authLimiter /
// refreshLimiter) et sont exclues du compteur global : sinon une rafale de
// refresh ratés (après logout/expiration) épuisait le quota et bloquait
// /auth/login en 429.
// Nécessite cookieParser en amont pour lire l'access token.
export const createGlobalLimiter = ({ windowMs, userMax, anonMax }) =>
    rateLimit({
        windowMs,
        limit: (req) => (authenticatedUserId(req) ? userMax : anonMax),
        keyGenerator: rateLimitKey,
        message: 'Too many requests, please try again later.',
        skip: (req) =>
            req.path === '/auth/login' ||
            req.path === '/auth/signup' ||
            req.path === '/auth/refresh',
    });
