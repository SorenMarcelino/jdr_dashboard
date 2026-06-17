// Options de cookies centralisées pour l'authentification.
//
// Déploiement same-origin (frontend et API derrière le même hôte via Caddy),
// donc `sameSite: 'lax'` suffit (CSRF couvert pour les requêtes cross-site, et
// les cookies suivent les navigations de premier niveau, contrairement à
// 'strict'). En production `secure: true` impose HTTPS.

const isProd = () => process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_MAX_AGE = 30 * 60 * 1000;            // 30 minutes
const REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14 jours

const baseOptions = () => ({
    httpOnly: true,            // Protection XSS : inaccessible au JS client
    secure: isProd(),          // HTTPS uniquement en production
    sameSite: 'lax',           // Protection CSRF
});

export const accessTokenCookieOptions = () => ({
    ...baseOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE,
});

export const refreshTokenCookieOptions = () => ({
    ...baseOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/auth/refresh',
});

// Options de suppression : mêmes attributs que la pose (hors maxAge) pour que
// le navigateur retrouve et efface bien le cookie.
export const clearAccessTokenCookieOptions = () => baseOptions();

export const clearRefreshTokenCookieOptions = () => ({
    ...baseOptions(),
    path: '/auth/refresh',
});
