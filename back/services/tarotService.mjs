import { TAROT_SPREADS } from "../config/tarotRegistry.mjs";

// Visibilité d'un tirage : public pour tous, secret pour le MJ et le tireur.

const sameId = (a, b) => !!a && !!b && a.toString() === b.toString();

/** Le spectateur peut-il voir les lames de ce tirage ? */
export function canSeeTarot({ secret, drawerId }, viewerId, gmId) {
    if (!secret) return true;
    return sameId(viewerId, gmId) || sameId(viewerId, drawerId);
}

const plainCards = (cards = []) => cards.map(({ cardId, reversed }) => ({ cardId, reversed: !!reversed }));

/**
 * État de la table tel que le voit un membre de la partie (événement
 * "tarot:state"). Un tirage secret ne révèle à la table que le nombre de
 * lames retournées.
 */
export function tarotStateFor(session, viewerId, gmId) {
    if (!session) return { status: "idle" };
    const visible = canSeeTarot(session, viewerId, gmId);
    return {
        status: session.status,
        spread: session.spread,
        allowReversed: !!session.allowReversed,
        secret: !!session.secret,
        drawer: { id: session.drawerId.toString(), username: session.drawerName, npc: !!session.npc },
        total: TAROT_SPREADS[session.spread],
        drawn: session.cards.length,
        remaining: session.deck.length,
        visible,
        cards: visible ? plainCards(session.cards) : [],
    };
}

/** Message de tirage (chat) tel que le voit un membre : brouillé si secret. */
export function tarotMessageFor(message, viewerId, gmId) {
    const tarot = message.tarot ?? {};
    const visible = canSeeTarot(tarot, viewerId, gmId);
    return {
        _id: message._id,
        gameId: message.gameId,
        userId: message.userId,
        username: message.username,
        type: "tarot",
        createdAt: message.createdAt,
        tarot: {
            spread: tarot.spread,
            secret: !!tarot.secret,
            drawerId: tarot.drawerId?.toString(),
            drawerName: tarot.drawerName || message.username,
            npc: !!tarot.npc,
            count: tarot.cards?.length ?? 0,
            visible,
            cards: visible ? plainCards(tarot.cards) : [],
        },
    };
}
