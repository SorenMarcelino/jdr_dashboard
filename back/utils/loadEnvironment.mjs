import dotenv from 'dotenv';
import { fileURLToPath} from "node:url";
import { dirname, join } from "node:path";

// Obtenir le checmin du dossier courant (utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Détecte quel fichier .env utiliser
const projectRoot = join(__dirname, '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envPath = join(projectRoot, envFile);

console.log('🔧 [loadEnvironment] Loading:', envPath);
dotenv.config({ path: envPath });

// Validation des variables d'environnement critiques
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'TOKEN_KEY', 'NODE_ENV'];

requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`ERROR: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});

console.log('✅ [loadEnvironment] Environment loaded successfully');
console.log('   MONGODB_URI DB:', process.env.MONGODB_URI?.match(/\.net\/([^?]+)/)?.[1] || 'default');

export default process.env;