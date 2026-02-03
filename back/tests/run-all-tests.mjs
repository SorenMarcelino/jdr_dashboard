import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

// Tests à exécuter dans l'ordre
const tests = [
    {
        name: 'Create Test User',
        file: 'test-create-user.mjs',
        description: 'Setup test user in database'
    },
    {
        name: 'Refresh Token Flow',
        file: 'test-refresh.mjs',
        description: 'Test access token expiration and refresh'
    }
];

async function runTest(test) {
    const testPath = join(__dirname, test.file);

    console.log(`\n${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📋 Running: ${test.name}${colors.reset}`);
    console.log(`${colors.bright}📝 Description: ${test.description}${colors.reset}`);
    console.log(`${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    try {
        const { stdout, stderr } = await execAsync(`node ${testPath}`);

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log(`${colors.green}✅ ${test.name} completed successfully${colors.reset}`);
        return { success: true, test: test.name };
    } catch (error) {
        console.error(`${colors.red}❌ ${test.name} failed${colors.reset}`);
        console.error(error.stdout || error.message);
        return { success: false, test: test.name, error: error.message };
    }
}

async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          🧪 Running All Tests Suite                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    const startTime = Date.now();
    const results = [];

    // Exécuter tous les tests en séquence
    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);

        // Si un test échoue, arrêter l'exécution
        if (!result.success) {
            console.log(`\n${colors.red}${colors.bright}⚠️  Test suite stopped due to failure${colors.reset}`);
            break;
        }
    }

    // Résumé
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📊 Test Summary${colors.reset}`);
    console.log(`${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`   Total tests: ${results.length}`);
    console.log(`   ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`   ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (failed === 0) {
        console.log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.red}${colors.bright}❌ Some tests failed${colors.reset}\n`);
        process.exit(1);
    }
}

// Run
await runAllTests();
