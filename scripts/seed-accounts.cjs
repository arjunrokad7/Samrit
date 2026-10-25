// Local demo accounts only. Existing credentials and assignments are preserved.
const { Client, config } = require('./db/connection.cjs');
const { call, login, pickup } = require('./seed-samrit.cjs');
const bcrypt = require('../backend/node_modules/bcrypt');
const { randomUUID } = require('node:crypto');

async function seedAccounts() {
  const db = new Client(config);
  await db.connect();
  try {
    const email = 'admin.demo@example.com';
    const existing = (await db.query('SELECT id,role FROM public."user" WHERE email=$1', [email])).rows[0];
    if (existing && existing.role !== 'ADMIN') throw Error('Demo admin email belongs to another role. No account changed.');
    if (!existing) await db.query(
      'INSERT INTO public."user"(id,email,password,name,role,"isActive","isVerified") VALUES($1,$2,$3,$4,$5,true,true)',
      [randomUUID(), email, await bcrypt.hash('DemoAdmin123!', 12), 'Samrit Demo Administrator', 'ADMIN'],
    );
    const admin = await login(email, 'DemoAdmin123!');
    const accounts = [
      { email: 'donor@example.com', name: 'Green Kitchen NYC Demo', role: 'DONOR', password: 'Demo123!' },
      { email: 'ngo@example.com', name: 'Community Table NYC Demo', role: 'NGO', password: 'Demo123!' },
      { email: 'driver.maya@example.com', name: 'Maya Thompson Demo Driver', role: 'VOLUNTEER', password: 'DemoDriver123!' },
    ];
    for (const account of accounts) {
      const found = (await db.query('SELECT role FROM public."user" WHERE email=$1', [account.email])).rows[0];
      if (found && found.role !== account.role) throw Error('Demo email belongs to a different role. No credentials changed.');
      if (!found) {
        if (account.role === 'VOLUNTEER') await call('/api/fleet/drivers', 'POST', {
          name: account.name, email: account.email, password: account.password,
          isAvailable: true, location: pickup,
        }, admin.token);
        else await call('/auth/register', 'POST', account);
      }
      const session = await login(account.email, account.password);
      if (session.user.role !== account.role) throw Error('Incorrect demo role');
      console.log(`Verified ${account.role}: ${account.email}`);
    }
    console.log(`Verified ADMIN: ${email}`);
    console.log('Food seekers use /consumer without an account.');
  } finally { await db.end(); }
}
seedAccounts().catch(error => { console.error(error.message); process.exitCode = 1; });
