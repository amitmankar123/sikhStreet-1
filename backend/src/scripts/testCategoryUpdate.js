const run = async () => {
    try {
        console.log('1. Attempting login to retrieve admin token...');
        const loginRes = await fetch('http://localhost:5002/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@admin.com',
                password: 'admin123'
            })
        });

        const loginJson = await loginRes.json();
        const token = loginJson?.data?.accessToken || loginJson?.accessToken;
        if (!token) {
            console.error('Failed to get admin token from login response:', loginJson);
            return;
        }
        console.log('✅ Admin login successful. Token acquired.');

        console.log('2. Attempting category update (toggle active status)...');
        const updateRes = await fetch('http://localhost:5002/api/admin/categories/fashion', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive: true })
        });

        const updateJson = await updateRes.json();
        console.log(`Status: ${updateRes.status}`);
        console.log('Response body:', JSON.stringify(updateJson, null, 2));
    } catch (err) {
        console.error('❌ Request failed!', err.message);
    }
};

run();
