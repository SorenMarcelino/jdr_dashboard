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
// entre les requêtes concurrentes) puis on rejoue la requête d'origine.
// Si le refresh échoue, on redirige vers /login.
// ─────────────────────────────────────────────────────────────────────────

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<unknown> | null = null;

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
            original._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = axios
                        .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }
                await refreshPromise;
                return axios(original);
            } catch (refreshError) {
                if (
                    typeof window !== "undefined" &&
                    !window.location.pathname.startsWith("/login")
                ) {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
