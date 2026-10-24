// Local demo data. Run with Node while the API and database are running.
const { Client } = require('../backend/node_modules/pg');
const base = 'http://localhost:3000';
const password = 'Demo123!';
async function api(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${JSON.stringify(result)}`);
  return result;
}
async function main() {
  const accounts = [
    { name: 'Green Kitchen Demo', email: 'donor@example.com', role: 'DONOR', organizationName: 'Green Kitchen', organizationType: 'Restaurant', phone: '+1-202-555-0101', address: '100 Demo Market Street, New York, NY' },
    { name: 'Community Care Demo', email: 'ngo@example.com', role: 'NGO', organizationName: 'Community Care Foundation', organizationType: 'NGO', phone: '+1-202-555-0102', address: '200 Demo Community Avenue, New York, NY' },
    { name: 'Alex Rivera Demo', email: 'volunteer@example.com', role: 'VOLUNTEER', phone: '+1-202-555-0103', address: '300 Demo Volunteer Lane, New York, NY' },
  ];
  for (const account of accounts) {
    try { await api('/auth/register', 'POST', { ...account, password }); }
    catch (error) { if (!error.message.includes('Email already exists')) throw error; }
    const login = await api('/auth/login', 'POST', { email: account.email, password });
    account.token = login.data.token;
    account.id = login.data.user.id;
    await api('/auth/profile', 'PATCH', {
      latitude: 40.7306, longitude: -73.9866,
      ...(account.role === 'VOLUNTEER' ? { vehicleType: 'car', vehicleNumber: 'DEMO-001', isAvailable: true } : {}),
    }, account.token);
  }
  const [donor, ngo, volunteer] = accounts;
  const admin = await api('/auth/login', 'POST', { email: 'admin@samrit.local', password: 'SecureAdmin123!' });
  await api(`/admin/verify/${ngo.id}`, 'PATCH', {}, admin.data.token);
  const samples = [
    ['Vegetable Biryani', 'cooked', 40, 'AVAILABLE'],
    ['Fresh Bread Basket', 'bakery', 25, 'AVAILABLE'],
    ['Seasonal Fruit Boxes', 'fruits', 30, 'AVAILABLE'],
    ['Rice and Lentil Meals', 'cooked', 35, 'CLAIMED'],
    ['Garden Salad Bowls', 'raw', 20, 'CLAIMED'],
    ['Vegetable Curry Meals', 'cooked', 30, 'PICKED_UP'],
    ['Community Lunch Packs', 'cooked', 50, 'DELIVERED'],
    ['Breakfast Snack Packs', 'packaged', 40, 'DELIVERED'],
  ];
  const existing = await api('/donations?status=AVAILABLE,CLAIMED,PICKED_UP,DELIVERED,EXPIRED&seed=' + Date.now());
  for (let i = 0; i < samples.length; i++) {
    const [name, foodType, quantity, target] = samples[i];
    if (existing.some(item => item.donorId === donor.id && item.name === name)) continue;
    const donation = await api('/donations', 'POST', {
      name, foodType, quantity, unit: 'servings', donorId: donor.id, donorName: donor.name,
      description: 'Fictional demo donation for exploring the platform. Packed in individual food-safe containers.',
      preparationTime: new Date(Date.now() - 30 * 60_000).toISOString(),
      expiryTime: new Date(Date.now() + (foodType === 'cooked' ? 6 : 24) * 3600_000).toISOString(),
      latitude: 40.7306 + i * 0.001, longitude: -73.9866 + i * 0.001,
      address: donor.address,
    }, donor.token);
    if (target !== 'AVAILABLE') await api(`/donations/${donation.id}/claim`, 'PATCH', { estimatedPickupTime: new Date(Date.now() + 30 * 60_000).toISOString() }, ngo.token);
    if (['PICKED_UP', 'DELIVERED'].includes(target)) await api(`/donations/${donation.id}/status`, 'PATCH', { status: 'PICKED_UP' }, volunteer.token);
    if (target === 'DELIVERED') {
      await api(`/donations/${donation.id}/status`, 'PATCH', { status: 'DELIVERED' }, volunteer.token);
      await api('/feedback', 'POST', { donationId: donation.id, rating: 5, comment: 'Demo review: fresh food, careful packaging, and a smooth volunteer delivery.' }, ngo.token);
    }
    console.log(`${name}: ${target}`);
  }
  // Normalize the demo NGO's load: the API concatenates PostgreSQL decimal
  // quantities as strings during claims. Scope this correction to this account.
  const db = new Client({ host: '127.0.0.1', user: 'postgres', password: 'postgres', database: 'samrit_db' });
  await db.connect();
  try {
    await db.query('UPDATE "user" SET "currentIntakeLoad" = (SELECT COALESCE(SUM(quantity), 0) FROM donation WHERE "claimedById" = $1 AND status IN (\'CLAIMED\', \'PICKED_UP\')) WHERE id::text = $1', [ngo.id]);
  } finally { await db.end(); }
  for (const account of accounts) {
    const profile = await api('/auth/profile', 'GET', undefined, account.token);
    console.log(JSON.stringify({ role: account.role, email: account.email, impact: profile.impactStats, karma: profile.karmaPoints }));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });


