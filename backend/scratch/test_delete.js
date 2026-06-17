import jwt from 'jsonwebtoken';

const JWT_SECRET = 'aether-erp-dashboard-super-secure-key-2026';
const token = jwt.sign({ username: 'admin', role: 'admin', id: 'admin-id' }, JWT_SECRET, { expiresIn: '7d' });

const BASE_URL = 'http://127.0.0.1:5000/api/grades/grade-iv';

async function run() {
  console.log('Sending DELETE request to:', BASE_URL);
  try {
    const res = await fetch(BASE_URL, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': 'greenvalley'
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
