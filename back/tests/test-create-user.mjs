import { User } from '../models/UserModel.mjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

console.log('🔍 Debug - Environment variables:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ UNDEFINED');
console.log('   TEST_USER_EMAIL:', process.env.TEST_USER_EMAIL || '❌ UNDEFINED');
console.log('   TEST_USER_PASSWORD:', process.env.TEST_USER_PASSWORD || '❌ UNDEFINED');
console.log('');

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL,
    username: 'testUser',
    password: process.env.TEST_USER_PASSWORD
};

console.log('🔍 Debug - TEST_USER object:');
console.log('   email:', TEST_USER.email);
console.log('   username:', TEST_USER.username);
console.log('   password:', TEST_USER.password);
console.log('');

async function testCreateUser() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Vérifier si l'utilisateur existe déjà
        console.log('🔍 Checking if user already exists...');
        const existingUser = await User.findOne({ email: TEST_USER.email });

        if (existingUser) {
            console.log('⚠️  User already exists, deleting...');
            await User.deleteOne({ email: TEST_USER.email });
            console.log('✅ Existing user deleted\n');
        } else {
            console.log('ℹ️  No existing user found\n');
        }

        // Créer l'utilisateur de test
        console.log('🔨 Creating test user...');
        console.log('   Email:', TEST_USER.email);
        console.log('   Username:', TEST_USER.username);
        console.log('   Password:', TEST_USER.password ? '***' : '❌ UNDEFINED');
        console.log('');

        const newUser = await User.create(TEST_USER);
        console.log('✅ User created successfully!');
        console.log('   ID:', newUser._id);
        console.log('   Email:', newUser.email);
        console.log('   Username:', newUser.username);
        console.log('   Password hash:', newUser.password ? newUser.password.substring(0, 20) + '...' : '❌ NO PASSWORD');
        console.log('');

        // Vérifier que l'utilisateur est bien dans la DB
        console.log('🔍 Verifying user in database...');
        const verifyUser = await User.findOne({ email: TEST_USER.email });

        if (verifyUser) {
            console.log('✅ User verified in database!');
            console.log('   Email:', verifyUser.email);
        } else {
            console.error('❌ ERROR: User NOT found in database after creation!');
        }

        await mongoose.disconnect();
        console.log('\n✅ Test completed successfully');

    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);

        // Erreurs spécifiques
        if (error.name === 'ValidationError') {
            console.error('\n⚠️  Validation Error Details:');
            Object.keys(error.errors).forEach(key => {
                console.error(`   - ${key}: ${error.errors[key].message}`);
            });
        }

        await mongoose.disconnect();
        process.exit(1);
    }
}

await testCreateUser();
