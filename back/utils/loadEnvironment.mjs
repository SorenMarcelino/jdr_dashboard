import dotenv from 'dotenv';
import { fileURLToPath} from "url";
import { dirname, join } from "path";
import path from "node:path";

// Obtenir le checmin du dossier courant (utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis le dossier back/ (parent du dossier utils.-/)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validation des variables d'environnement critiques
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'TOKEN_KEY', 'NODE_ENV'];

requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`ERROR: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});

export default process.env;