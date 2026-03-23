import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import authRoute from './routes/AuthRoute.mjs';
import api from "./routes/api.mjs";
import gamesRoute from "./routes/GamesRoute.mjs";
import characterSheetRoute from "./routes/CharacterSheetRoute.mjs";
import './utils/loadEnvironment.mjs';
import {errorHandler} from "./middlewares/ErrorHandler.mjs"; // Configuration dotenv centralisée
import { seedMagnusArchives } from "./seeds/magnusArchivesSeed.mjs";
import { setupSocketHandlers } from "./socket/socketHandler.mjs";

const app = express();
const server = http.createServer(app);
const { MONGODB_URI, PORT, CORS_ORIGIN, NODE_ENV } = process.env;

// Sécurité avec Helmet
app.use(helmet());

// Configuration CORS sécurisées (doit être avant les rate limiters)
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
    max: 100, // limite de 100 requêtes par IP
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Limite stricte pour login/signup uniquement
    message: 'Too many authentification attempts, please try again later.'
});
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);

app.use(limiter);

// Middlewares
app.use(express.json({ limit: '10mb' })); // Limite la taille des requêtes
app.use(cookieParser());

// Logging des requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/auth", authRoute);
app.use("/api", api);
app.use("/games", gamesRoute);
app.use("/character-sheets", characterSheetRoute);

app.use(errorHandler);

// Connexion MongoDB avec gestion d'erreurs
mongoose
    .connect(MONGODB_URI)
    .then(async () => {
        await seedMagnusArchives();
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is listening on port ${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
            console.log("MongoDB is connected successfully");
            console.log("Socket.io is ready");
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

mongoose.connection.on('connected', () => {
    console.log('MongoDB is connected successfully');
    console.log('🔍 Debug - Database info:');
    console.log('   Database name:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
})