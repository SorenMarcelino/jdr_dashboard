import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Clés de test (pas de secret réel nécessaire pour des tests unitaires).
process.env.TOKEN_KEY = process.env.TOKEN_KEY || "test-token-key";
process.env.REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY || "test-refresh-key";

const { createAccessToken } = await import("../../utils/SecretToken.mjs");
const { rateLimitKey, createGlobalLimiter } = await import("../../middlewares/rateLimiters.mjs");

const fakeReq = (cookies = {}, ip = "203.0.113.7") => ({ cookies, ip });

test("rateLimitKey keys an authenticated request by user id", () => {
    const token = createAccessToken("user-123");
    assert.equal(rateLimitKey(fakeReq({ accessToken: token })), "user:user-123");
});

test("rateLimitKey falls back to the IP without a token", () => {
    assert.equal(rateLimitKey(fakeReq()), "ip:203.0.113.7");
});

test("rateLimitKey falls back to the IP on a forged token", () => {
    const forged = jwt.sign({ id: "victim" }, "not-the-server-key");
    assert.equal(rateLimitKey(fakeReq({ accessToken: forged })), "ip:203.0.113.7");
});

test("rateLimitKey falls back to the IP on an expired token", () => {
    const expired = jwt.sign({ id: "user-123" }, process.env.TOKEN_KEY, { expiresIn: -10 });
    assert.equal(rateLimitKey(fakeReq({ accessToken: expired })), "ip:203.0.113.7");
});

// Petite app Express avec le limiter global, sur un port éphémère : toutes
// les requêtes viennent de 127.0.0.1, comme une table de joueurs derrière la
// même box.
async function withApp(limiterOptions, run) {
    const app = express();
    app.use(cookieParser());
    app.use(createGlobalLimiter({ windowMs: 60_000, ...limiterOptions }));
    app.get("/ping", (req, res) => res.json({ ok: true }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        await run((cookie) =>
            fetch(`${base}/ping`, { headers: cookie ? { Cookie: cookie } : {} }).then((r) => r.status)
        );
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

test("players sharing one IP each get their own quota", async () => {
    await withApp({ userMax: 3, anonMax: 2 }, async (ping) => {
        const alice = `accessToken=${createAccessToken("alice")}`;
        const bob = `accessToken=${createAccessToken("bob")}`;

        for (let i = 0; i < 3; i++) assert.equal(await ping(alice), 200);
        // Alice a épuisé SON quota…
        assert.equal(await ping(alice), 429);
        // …mais Bob, sur la même IP, n'est pas impacté.
        assert.equal(await ping(bob), 200);
    });
});

test("anonymous requests stay limited per IP", async () => {
    await withApp({ userMax: 3, anonMax: 2 }, async (ping) => {
        assert.equal(await ping(), 200);
        assert.equal(await ping(), 200);
        assert.equal(await ping(), 429);
        // Un joueur connecté sur la même IP n'hérite pas du blocage anonyme.
        assert.equal(await ping(`accessToken=${createAccessToken("carol")}`), 200);
    });
});

test("auth routes are not counted by the global limiter", async () => {
    const app = express();
    app.use(cookieParser());
    app.use(createGlobalLimiter({ windowMs: 60_000, userMax: 1, anonMax: 1 }));
    app.post("/auth/login", (req, res) => res.json({ ok: true }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/auth/login`;
    try {
        for (let i = 0; i < 3; i++) {
            assert.equal((await fetch(url, { method: "POST" })).status, 200);
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
