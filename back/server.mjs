import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import authRoute from './routes/AuthRoute.mjs';
import api from "./routes/api.mjs";
import gamesRoute from "./routes/GamesRoute.mjs";
import characterSheetRoute from "./routes/CharacterSheetRoute.mjs";
import './utils/loadEnvironment.mjs'; // Configuration dotenv centralisée
import logger from "./utils/logger.mjs";
import {errorHandler} from "./middlewares/ErrorHandler.mjs";
import { seedMagnusArchives } from "./seeds/magnusArchivesSeed.mjs";
import { seedCallOfCthulhu } from "./seeds/callOfCthulhuSeed.mjs";
import { setupSocketHandlers } from "./socket/socketHandler.mjs";

const app = express();
const server = http.createServer(app);
const { MONGODB_URI, PORT, CORS_ORIGIN, NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

// Derrière un reverse proxy (Caddy/Nginx sur le VPS), l'IP client réelle est
// dans X-Forwarded-For. Indispensable pour que le rate-limiting fonctionne.
app.set('trust proxy', 1);

// Sécurité avec Helmet
app.use(helmet());

// Configuration CORS sécurisée (doit être avant les rate limiters)
const allowedOrigins = CORS_ORIGIN ? CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'];

// Socket.io
const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
setupSocketHandlers(io);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// Rate limiting pour prévenir les attaques par brute force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 100 : 500,
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Limite stricte pour login/signup uniquement
    message: 'Too many authentification attempts, please try again later.'
});
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);

// Le refresh est appelé fréquemment par les sessions légitimes : on ne compte
// que les tentatives ÉCHOUÉES (token invalide), pour bloquer l'abus sans
// déconnecter les utilisateurs actifs.
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    message: 'Too many token refresh attempts, please try again later.'
});
app.use('/auth/refresh', refreshLimiter);

app.use(limiter);

// Middlewares
app.use(express.json({ limit: '10mb' })); // Limite la taille des requêtes
app.use(cookieParser());

// Logging HTTP (désactivé en environnement de test)
if (NODE_ENV !== 'test') {
    app.use(morgan(isProd ? 'combined' : 'dev'));
}

// Healthcheck : vérifie aussi la connexion MongoDB (1 = connected). Renvoie 503
// si la DB est indisponible pour que l'orchestrateur détecte une instance dégradée.
app.get('/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
        status: dbUp ? 'ok' : 'degraded',
        db: dbUp ? 'up' : 'down',
    });
});

// Routes
app.use("/auth", authRoute);
app.use("/api", api);
app.use("/games", gamesRoute);
app.use("/character-sheets", characterSheetRoute);

app.use(errorHandler);

// Les seeds ne tournent qu'en dev (données de démonstration).
async function runSeeds() {
    if (isProd) return;
    await seedMagnusArchives();
    await seedCallOfCthulhu();
}

// Connexion MongoDB puis démarrage du serveur
mongoose
    .connect(MONGODB_URI)
    .then(async () => {
        logger.info('MongoDB connected successfully');
        await runSeeds();
        server.listen(PORT, '0.0.0.0', () => {
            logger.info({ port: PORT, env: NODE_ENV }, 'Server listening, Socket.io ready');
        });
    })
    .catch((error) => {
        logger.fatal({ err: error }, 'MongoDB connection error');
        process.exit(1);
    });

// ── Arrêt gracieux ────────────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');

    // Stoppe l'acceptation de nouvelles connexions, puis ferme proprement.
    const forceExit = setTimeout(() => {
        logger.error('Forced shutdown (timeout)');
        process.exit(1);
    }, 10000);

    try {
        io.close();
        await new Promise((resolve) => server.close(resolve));
        await mongoose.connection.close(false);
        clearTimeout(forceExit);
        logger.info('Graceful shutdown complete');
        process.exit(0);
    } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Erreurs non gérées : on log et on déclenche un arrêt gracieux.
process.on('unhandledRejection', (error) => {
    logger.error({ err: error }, 'Unhandled Rejection');
    shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught Exception');
    shutdown('uncaughtException');
});
