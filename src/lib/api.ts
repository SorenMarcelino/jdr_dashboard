import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// URL de l'API et du serveur Socket.io.
// En production, frontend et API sont servis sous le même hôte (Caddy fait le
// reverse-proxy par chemin), donc on utilise une base relative ("" => même
// origine). En dev, on cible le backend sur le port 5050.
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

export const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050");

// Toutes les requêtes envoient les cookies httpOnly d'auth.
axios.defaults.withCredentials = true;

// ─────────────────────────────────────────────────────────────────────────
// Intercepteur de rafraîchissement de token.
// Sur une réponse 401, on tente un /auth/refresh (une seule fois, mutualisé
// entre TOUTES les requêtes — concurrentes comme séquentielles) puis on
// rejoue la requête d'origine.
// Si le refresh échoue (token révoqué/expiré), on pose un verrou : plus
// aucun appel réseau vers /auth/refresh tant qu'un login n'a pas réussi,
// et une seule redirection vers /login. Sans ce verrou, chaque requête en
// 401 (autosave, composants encore montés) relançait un refresh qui
// consommait le rate-limit IP et finissait par bloquer /auth/login en 429.
// ─────────────────────────────────────────────────────────────────────────

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<unknown> | null = null;
let authRefreshFailed = false;
let redirectedToLogin = false;

// À appeler après un login réussi pour réarmer le mécanisme de refresh.
export function resetAuthState() {
    authRefreshFailed = false;
    redirectedToLogin = false;
    refreshPromise = null;
}

const isAuthEndpoint = (url: string) =>
    url.includes("/auth/login") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/verify") ||
    url.includes("/auth/logout");

axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;
        const status = error.response?.status;
        const url = original?.url ?? "";

        if (status === 401 && original && !original._retry && !isAuthEndpoint(url)) {
            // Arrêt franc : un refresh a déjà échoué durant cette session,
            // inutile de retenter — on rejette sans toucher au réseau.
            if (authRefreshFailed) {
                return Promise.reject(error);
            }
            original._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = axios
                        .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
                        .then((res) => {
                            // Succès : on libère le single-flight pour le
                            // prochain cycle d'expiration.
                            refreshPromise = null;
                            return res;
                        })
                        .catch((err) => {
                            // Échec : verrou posé, refreshPromise reste la
                            // promesse rejetée pour les requêtes déjà en vol.
                            authRefreshFailed = true;
                            throw err;
                        });
                }
                await refreshPromise;
                return axios(original);
            } catch (refreshError) {
                if (
                    typeof window !== "undefined" &&
                    !redirectedToLogin &&
                    !window.location.pathname.startsWith("/login")
                ) {
                    redirectedToLogin = true;
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
