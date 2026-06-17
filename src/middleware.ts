import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Content-Security-Policy par nonce.
// Chaque requête de page reçoit un nonce unique : Next.js (et next-themes via la
// prop `nonce`) l'injecte dans ses scripts. Cela permet de retirer
// 'unsafe-inline' de `script-src` en production sans casser l'hydratation.
export function middleware(request: NextRequest) {
    const nonce = btoa(crypto.randomUUID());
    const isDev = process.env.NODE_ENV !== "production";

    // En dev, Turbopack/HMR exige 'unsafe-eval' + 'unsafe-inline' et un
    // websocket vers le backend/HMR local. En prod : nonce uniquement.
    const scriptSrc = isDev
        ? "'self' 'unsafe-inline' 'unsafe-eval'"
        : `'self' 'nonce-${nonce}'`;
    // Origines externes autorisées pour fetch/XHR/WebSocket. En prod same-origin
    // (Caddy), 'self' suffit. En dev natif (Turbopack), on autorise le backend
    // local + le websocket HMR. Le cas Docker dev exécute un build *production*
    // (NODE_ENV=production) servi sur une origine distincte du backend : on
    // injecte alors les origines via EXTRA_CONNECT_SRC, lu au runtime.
    const extraConnect = process.env.EXTRA_CONNECT_SRC ?? "";
    const devConnect = isDev
        ? "http://localhost:5050 ws://localhost:5050 ws://localhost:3000"
        : "";
    const connectSrc = ["'self'", devConnect, extraConnect]
        .filter(Boolean)
        .join(" ");

    const csp = [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        // Styles inline conservés (Next.js, Tailwind et framer-motion en injectent).
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        `connect-src ${connectSrc}`,
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join("; ");

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    // Next.js lit cet en-tête pour propager le nonce à ses propres scripts.
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
}

export const config = {
    matcher: [
        // Toutes les routes sauf les assets statiques et l'API. On exclut aussi
        // les prefetchs (le nonce ne doit pas être mis en cache côté routeur).
        {
            source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
            missing: [
                { type: "header", key: "next-router-prefetch" },
                { type: "header", key: "purpose", value: "prefetch" },
            ],
        },
    ],
};
