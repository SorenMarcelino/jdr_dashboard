// Enveloppe un handler async pour router toute exception vers le middleware
// d'erreurs centralisé (ErrorHandler.mjs), évitant les try/catch répétitifs.
//
//   router.post("/x", asyncHandler(async (req, res) => { ... }))
//
// Toute erreur levée (ou rejet de promesse) est passée à next(err).
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
