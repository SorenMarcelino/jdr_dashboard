import { test } from "node:test";
import assert from "node:assert/strict";
import {
    signupSchema,
    loginSchema,
    createGameSchema,
    joinGameSchema,
    reorderScenariosSchema,
    reorderPagesSchema,
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

test("reorderScenariosSchema accepts a list of scenarioId/order pairs", () => {
    const r = reorderScenariosSchema.safeParse({
        orders: [
            { scenarioId: "abc123", order: 0 },
            { scenarioId: "def456", order: 1 },
        ],
    });
    assert.ok(r.success);
});

test("reorderScenariosSchema rejects an empty list", () => {
    assert.ok(!reorderScenariosSchema.safeParse({ orders: [] }).success);
});

test("reorderScenariosSchema rejects a missing order", () => {
    assert.ok(!reorderScenariosSchema.safeParse({ orders: [{ scenarioId: "abc123" }] }).success);
});

test("reorderPagesSchema accepts a list of pageId/order pairs", () => {
    const r = reorderPagesSchema.safeParse({
        orders: [
            { pageId: "abc123", order: 0 },
            { pageId: "def456", order: 1 },
        ],
    });
    assert.ok(r.success);
});

test("reorderPagesSchema rejects an empty list", () => {
    assert.ok(!reorderPagesSchema.safeParse({ orders: [] }).success);
});
