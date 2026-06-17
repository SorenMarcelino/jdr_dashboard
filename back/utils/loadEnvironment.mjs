import dotenv from 'dotenv';
import { fileURLToPath} from "node:url";
import { dirname, join } from "node:path";
import logger from "./logger.mjs";

// Obtenir le checmin du dossier courant (utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Détecte quel fichier .env utiliser
const projectRoot = join(__dirname, '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envPath = join(projectRoot, envFile);

dotenv.config({ path: envPath });

// Validation des variables d'environnement critiques
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'TOKEN_KEY', 'REFRESH_TOKEN_KEY', 'NODE_ENV'];

const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    process.exit(1);
}

logger.info('Environment loaded successfully');

export default process.env;