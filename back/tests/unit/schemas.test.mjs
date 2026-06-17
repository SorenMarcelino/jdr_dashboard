import { test } from "node:test";
import assert from "node:assert/strict";
import {
    signupSchema,
    loginSchema,
    createGameSchema,
    joinGameSchema,
} from "../../validation/schemas.mjs";

test("signupSchema accepts valid payload", () => {
    const r = signupSchema.safeParse({
        email: "user@example.com",
        username: "Aragorn",
        password: "longenough",
    });
    assert.ok(r.success);
});

test("signupSchema rejects bad email and short password", () => {
    assert.ok(!signupSchema.safeParse({ email: "x", username: "a", password: "longenough" }).success);
    assert.ok(!signupSchema.safeParse({ email: "u@e.com", username: "a", password: "short" }).success);
});

test("loginSchema requires email and password", () => {
    assert.ok(loginSchema.safeParse({ email: "u@e.com", password: "x" }).success);
    assert.ok(!loginSchema.safeParse({ email: "u@e.com" }).success);
});

test("createGameSchema requires name and characterSheet", () => {
    assert.ok(createGameSchema.safeParse({ name: "Partie", characterSheet: "cypher" }).success);
    assert.ok(!createGameSchema.safeParse({ name: "Partie" }).success);
    assert.ok(!createGameSchema.safeParse({ name: "", characterSheet: "cypher" }).success);
});

test("joinGameSchema bounds invite code length", () => {
    assert.ok(joinGameSchema.safeParse({ inviteCode: "ABC123" }).success);
    assert.ok(!joinGameSchema.safeParse({ inviteCode: "AB" }).success);
});
