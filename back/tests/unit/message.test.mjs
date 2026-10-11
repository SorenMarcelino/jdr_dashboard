import { test } from "node:test";
import assert from "node:assert/strict";
import { canSeeMessage, messageAudience, privacyFields, visibleMessagesFilter } from "../../services/messageService.mjs";

const GM = "aaaaaaaaaaaaaaaaaaaaaaaa";
const PLAYER = "bbbbbbbbbbbbbbbbbbbbbbbb";
const OTHER = "cccccccccccccccccccccccc";

test("a public message is visible to every member", () => {
    const message = { userId: PLAYER };
    assert.equal(canSeeMessage(message, GM), true);
    assert.equal(canSeeMessage(message, OTHER), true);
    assert.equal(messageAudience(message), null);
    assert.deepEqual(privacyFields(message), {});
});

test("a GM → player message is hidden from the other players", () => {
    const message = { userId: GM, recipientId: PLAYER };
    assert.equal(canSeeMessage(message, GM), true);
    assert.equal(canSeeMessage(message, PLAYER), true);
    assert.equal(canSeeMessage(message, OTHER), false);
});

test("a player → player message is hidden from the GM", () => {
    const message = { userId: PLAYER, recipientId: OTHER };
    assert.equal(canSeeMessage(message, PLAYER), true);
    assert.equal(canSeeMessage(message, OTHER), true);
    assert.equal(canSeeMessage(message, GM), false);
});

test("a private message is emitted to its author and recipient only", () => {
    const message = { userId: { toString: () => PLAYER }, recipientId: { toString: () => GM }, recipientUsername: "MJ" };
    assert.deepEqual(messageAudience(message), [PLAYER, GM]);
    assert.deepEqual(privacyFields(message), { recipientId: GM, recipientUsername: "MJ" });
});

test("the history filter keeps public messages and the viewer's private ones", () => {
    assert.deepEqual(visibleMessagesFilter(OTHER), {
        $or: [{ recipientId: null }, { userId: OTHER }, { recipientId: OTHER }],
    });
});
