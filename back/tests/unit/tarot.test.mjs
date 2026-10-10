import { test } from "node:test";
import assert from "node:assert/strict";
import { TAROT_DECKS, TAROT_SPREADS, drawCard, getTarotDeck, shuffleDeck } from "../../config/tarotRegistry.mjs";
import { canSeeTarot, tarotMessageFor, tarotStateFor } from "../../services/tarotService.mjs";

const GM = "aaaaaaaaaaaaaaaaaaaaaaaa";
const DRAWER = "bbbbbbbbbbbbbbbbbbbbbbbb";
const OTHER = "cccccccccccccccccccccccc";

test("getTarotDeck resolves the deck from the game's character sheet", () => {
    assert.equal(getTarotDeck("Magnus Archives"), TAROT_DECKS.magnus_archives);
    assert.equal(getTarotDeck("magnus_archives"), TAROT_DECKS.magnus_archives);
    assert.equal(getTarotDeck("Hydre"), TAROT_DECKS.hydre);
    assert.equal(getTarotDeck("Donjons"), null);
    assert.equal(getTarotDeck(undefined), null);
});

test("Hydre deck has the 22 distinct major arcana", () => {
    const deck = TAROT_DECKS.hydre;
    assert.equal(deck.length, 22);
    assert.equal(new Set(deck).size, 22);
});

test("Magnus deck has 17 distinct cards", () => {
    const deck = TAROT_DECKS.magnus_archives;
    assert.equal(deck.length, 17);
    assert.equal(new Set(deck).size, 17);
});

test("shuffleDeck keeps every card exactly once and does not mutate its input", () => {
    const deck = TAROT_DECKS.magnus_archives;
    const before = [...deck];
    const shuffled = shuffleDeck(deck);
    assert.deepEqual(deck, before);
    assert.deepEqual([...shuffled].sort(), [...deck].sort());
});

test("drawCard takes the top card and returns the rest", () => {
    const { card, deck } = drawCard(["oeil", "toile", "fin"], false);
    assert.deepEqual(card, { cardId: "oeil", reversed: false });
    assert.deepEqual(deck, ["toile", "fin"]);
    assert.equal(drawCard([], true), null);
});

test("drawCard never reverses a card when reversals are not allowed", () => {
    for (let i = 0; i < 50; i++) {
        assert.equal(drawCard(["oeil"], false).card.reversed, false);
    }
});

test("a public reading is visible to everyone", () => {
    assert.equal(canSeeTarot({ secret: false, drawerId: DRAWER }, OTHER, GM), true);
});

test("a secret reading is visible only to the GM and the drawer", () => {
    const draw = { secret: true, drawerId: DRAWER };
    assert.equal(canSeeTarot(draw, GM, GM), true);
    assert.equal(canSeeTarot(draw, DRAWER, GM), true);
    assert.equal(canSeeTarot(draw, OTHER, GM), false);
});

test("tarotStateFor hides the cards of a secret reading from the table", () => {
    const session = {
        status: "open", spread: "trois", allowReversed: true, secret: true,
        drawerId: DRAWER, drawerName: "Martin", deck: ["fin"], cards: [{ cardId: "oeil", reversed: true }],
    };
    const forOther = tarotStateFor(session, OTHER, GM);
    assert.equal(forOther.visible, false);
    assert.deepEqual(forOther.cards, []);
    assert.equal(forOther.drawn, 1);
    assert.equal(forOther.total, TAROT_SPREADS.trois);

    const forDrawer = tarotStateFor(session, DRAWER, GM);
    assert.deepEqual(forDrawer.cards, [{ cardId: "oeil", reversed: true }]);
    assert.deepEqual(tarotStateFor(null, OTHER, GM), { status: "idle" });
});

test("tarotMessageFor scrambles a secret draw but keeps its card count", () => {
    const message = {
        _id: "m1", gameId: "g1", userId: DRAWER, username: "Martin", type: "tarot", createdAt: "2026-10-10",
        tarot: { spread: "unique", secret: true, drawerId: DRAWER, cards: [{ cardId: "fin", reversed: false }] },
    };
    const hidden = tarotMessageFor(message, OTHER, GM).tarot;
    assert.equal(hidden.visible, false);
    assert.equal(hidden.count, 1);
    assert.deepEqual(hidden.cards, []);
    assert.deepEqual(tarotMessageFor(message, GM, GM).tarot.cards, [{ cardId: "fin", reversed: false }]);
});

test("an NPC reading drawn by the GM carries the NPC's name and stays GM-only when secret", () => {
    const session = {
        status: "open", spread: "unique", allowReversed: false, secret: true,
        drawerId: GM, drawerName: "Jonah Magnus", npc: true, deck: [], cards: [{ cardId: "oeil", reversed: false }],
    };
    assert.deepEqual(tarotStateFor(session, GM, GM).drawer, { id: GM, username: "Jonah Magnus", npc: true });
    assert.equal(tarotStateFor(session, GM, GM).visible, true);
    assert.equal(tarotStateFor(session, DRAWER, GM).visible, false);

    const message = {
        _id: "m2", gameId: "g1", userId: GM, username: "Archivist", type: "tarot", createdAt: "2026-10-10",
        tarot: { spread: "unique", secret: false, drawerId: GM, drawerName: "Jonah Magnus", npc: true, cards: [] },
    };
    assert.equal(tarotMessageFor(message, OTHER, GM).tarot.drawerName, "Jonah Magnus");
    assert.equal(tarotMessageFor(message, OTHER, GM).tarot.npc, true);
    delete message.tarot.drawerName;
    assert.equal(tarotMessageFor(message, OTHER, GM).tarot.drawerName, "Archivist");
});
