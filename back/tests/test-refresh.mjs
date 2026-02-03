import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import dotenv from "dotenv";

dotenv.config({ path: '.env.test' });

const BASE_URL = 'http://localhost:5050';
const jar = new CookieJar();

// Crée une instance axios avec withCrendentials
const api = wrapper(axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    jar: jar,
    validateStatus: () => true
}));

async function testRefreshToken() {
    console.log('🧪 Starting Refresh Token Test\n');

    try {
        // 1. Login
        const loginRes = await api.post('/auth/login', {
            email: process.env.TEST_USER_EMAIL,
            password: process.env.TEST_USER_PASSWORD,
        });

        if (loginRes.status !== 200) {
            console.error('❌ Login failed:', loginRes.data);
            return;
        }

        console.log('✅ Login successful');
        console.log('   User:', loginRes.data.user.email);
        console.log('   Cookies:', loginRes.headers['set-cookie'] || 'Not visible in response\n');

        // 2. Test protected route immediately
        console.log('2️⃣ Testing protected route (should work)...');
        const profileRes1 = await api.get('/api/users');
        if (profileRes1.status === 200) {
            console.log('✅ Protected route accessible with fresh access token\n');
        } else {
            console.error('❌ Protected route failed:', profileRes1.data, '\n');
        }

        // 3. Wait for token expiration
        console.log('3️⃣ Waiting 31 seconds for access token expiration...');
        await new Promise(resolve => setTimeout(resolve, 31000));
        console.log('✅ Wait complete\n');

        // 4. Try protected route again (should fail with TOKEN_EXPIRED
        console.log('4️⃣ Testing protected route (should fail with TOKEN_EXPIRED)...');

        const profileRes2 = await api.get('/api/users');
        if (profileRes2.status === 401 && profileRes2.data.code === 'TOKEN_EXPIRED') {
            console.log('✅ Access token expired as expected');
            console.log('   Response:', profileRes2.data, '\n');
        } else {
            console.error('❌ Expected 401 TOKEN_EXPIRED, got:', profileRes2.status, profileRes2.data, '\n');
        }

        // 5. Call refresh endpoint
        console.log('5️⃣ Calling /auth/refresh...');
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.status === 200) {
            console.log('✅ Refresh successful!');
            console.log('   Response:', refreshRes.data);
            console.log('   New cookies set:', refreshRes.headers['set-cookie'] || 'Not visible\n');
        } else {
            console.error('❌ Refresh failed:', refreshRes.data, '\n');
            return;
        }

        // 6. Try protected route with new token
        console.log('6️⃣ Testing protected route with new access token...');
        const profileRes3 = await api.get('/api/users');

        if (profileRes3.status === 200) {
            console.log('✅ Protected route accessible with refreshed token!');
            console.log('   Data received:', profileRes3.data.success ? 'Success' : profileRes3.data);
        } else {
            console.error('❌ Protected route still failing:', profileRes3.data);
        }

        console.log('\n🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);

        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

await testRefreshToken();