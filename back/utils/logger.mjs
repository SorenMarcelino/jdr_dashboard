import pino from "pino";

// Logger structuré centralisé. Niveau configurable via LOG_LEVEL.
// En production, JSON sur stdout (agrégeable). En dev, niveau debug.
const isProd = process.env.NODE_ENV === "production";

const logger = pino({
    level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
    // Ne jamais logger de secrets, même si un objet en contient un.
    redact: {
        paths: ["password", "token", "accessToken", "refreshToken", "*.password", "*.token"],
        censor: "[redacted]",
    },
});

export default logger;
