// Middleware générique de validation via un schéma Zod.
// Usage: router.post("/x", validate(schema), handler)
//        router.get("/y", validate(schema, "query"), handler)
export const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
            })),
        });
    }
    // Remplace par la donnée validée/nettoyée (uniquement pour le body :
    // req.query est en lecture seule selon les versions d'Express).
    if (source === "body") req.body = result.data;
    next();
};
