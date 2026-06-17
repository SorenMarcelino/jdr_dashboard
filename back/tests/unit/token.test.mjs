import { test } from "node:test";
import assert from "node:assert/strict";

// Clés de test (pas de secret réel nécessaire pour des tests unitaires).
process.env.TOKEN_KEY = process.env.TOKEN_KEY || "test-token-key";
process.env.REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY || "test-refresh-key";

const {
    createAccessToken,
    verifyAccessToken,
    createRefreshToken,
    verifyRefreshToken,
} = await import("../../utils/SecretToken.mjs");

test("access token round-trips the user id", () => {
    const token = createAccessToken("user-123");
    const decoded = verifyAccessToken(token);
    assert.equal(decoded.id, "user-123");
});

test("refresh token round-trips the user id", () => {
    const token = createRefreshToken("user-456");
    const decoded = verifyRefreshToken(token);
    assert.equal(decoded.id, "user-456");
});

test("verifyAccessToken returns null on a tampered token", () => {
    assert.equal(verifyAccessToken("garbage.token.value"), null);
});

test("createAccessToken requires an id", () => {
    assert.throws(() => createAccessToken(), /User ID is required/);
});

test("an access token is not valid as a refresh token (separate keys)", () => {
    const access = createAccessToken("user-789");
    assert.equal(verifyRefreshToken(access), null);
});
