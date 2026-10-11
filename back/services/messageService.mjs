// Visibilité d'un message de chat : public pour toute la partie, ou privé entre
// son auteur et son destinataire (MJ ↔ PJ comme PJ ↔ PJ : un tiers, MJ compris,
// ne le voit pas).

const sameId = (a, b) => !!a && !!b && a.toString() === b.toString();

/** Le spectateur peut-il voir ce message ? */
export function canSeeMessage({ userId, recipientId }, viewerId) {
    if (!recipientId) return true;
    return sameId(viewerId, userId) || sameId(viewerId, recipientId);
}

/** Filtre Mongo des messages visibles par un membre (les anciens messages n'ont pas de recipientId). */
export function visibleMessagesFilter(viewerId) {
    return {
        $or: [
            { recipientId: null },
            { userId: viewerId },
            { recipientId: viewerId },
        ],
    };
}

/** Ids des membres qui reçoivent ce message, ou null s'il est public. */
export function messageAudience({ userId, recipientId }) {
    if (!recipientId) return null;
    return [userId.toString(), recipientId.toString()];
}

/** Champs de confidentialité ajoutés à la charge utile envoyée aux clients. */
export function privacyFields(message) {
    if (!message.recipientId) return {};
    return {
        recipientId: message.recipientId.toString(),
        recipientUsername: message.recipientUsername,
    };
}
