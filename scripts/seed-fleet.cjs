// Explicit localhost-only NGO fleet fixtures. Keeps existing routes and users.
const { call, login, pickup, photo } = require('./seed-samrit.cjs');
async function seedFleet() {
  const admin = await login(process.env.SUPER_ADMIN_EMAIL || 'admin@samrit.local', process.env.SUPER_ADMIN_PASSWORD || 'SecureAdmin123!');
  let data = await call('/api/samrit/overview', 'GET', undefined, admin.token);
  const specs = [
    { name: 'NYC Demo Hot Meals Truck', registration: 'DEMO-NYC-HOT', capacityServings: 250, capabilities: ['shelf_stable','hot'], equipment: ['Insulated hot holding boxes','Hand truck'], status: 'ready' },
    { name: 'NYC Demo Refrigerated Van', registration: 'DEMO-NYC-COLD', capacityServings: 180, capabilities: ['shelf_stable','refrigerated'], equipment: ['Refrigerated compartment','Temperature logger'], status: 'ready' },
    { name: 'NYC Demo Freezer Truck', registration: 'DEMO-NYC-FREEZE', capacityServings: 150, capabilities: ['shelf_stable','frozen'], equipment: ['Freezer compartment','Lift gate'], status: 'maintenance' },
  ];
  for (const vehicle of specs) if (!data.vehicles.some(item => item.registration === vehicle.registration)) await call('/api/fleet/vehicles', 'POST', vehicle, admin.token);
  for (const driver of [{ name: 'Maya Thompson · Demo Driver', email: 'driver.maya@example.com', phone: '+1-212-555-0104' }, { name: 'Jordan Lee · Demo Driver', email: 'driver.jordan@example.com', phone: '+1-212-555-0105' }]) {
    if (!data.drivers.some(item => item.email === driver.email)) await call('/api/fleet/drivers', 'POST', { ...driver, password: 'DemoDriver123!', isAvailable: true, location: pickup }, admin.token);
  }
  data = await call('/api/samrit/overview', 'GET', undefined, admin.token);
  if (process.argv.includes('--with-route')) {
    const driver = data.drivers.find(item => item.email === 'driver.maya@example.com');
    const truck = data.vehicles.find(item => item.registration === 'DEMO-NYC-HOT');
    const driverBusy = data.routes.some(route => route.status === 'active' && route.driverId === driver.id);
    const truckBusy = data.routes.some(route => route.status === 'active' && route.vehicleId === truck.vehicleId);
    if (!driverBusy && !truckBusy && truck.status === 'ready') {
      const donor = await login('donor@example.com');
      const item = { name: 'Demo warm vegetable bowls', ingredients: ['Rice', 'Carrot', 'Beans'], allergens: [], estimatedServings: 30, handlingRequirement: 'hot', verified: true };
      const event = await call('/api/events', 'POST', { name: 'NYC fleet workflow demo', scheduledAt: new Date().toISOString(), location: pickup, items: [item], notes: 'FICTIONAL LOCAL DEMO: synthetic evidence and simulated pickup location. Created to demonstrate NGO fleet dispatch.' }, donor.token);
      const evidence = await photo(1, pickup, donor.token);
      const batch = await call('/api/batches', 'POST', { donorEventId: event.eventId, items: [item], handlingRequirement: 'hot', expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(), photoId: evidence.photoId }, donor.token);
      await call('/api/logistics/match', 'POST', { batchId: batch.batchId, driverId: driver.id, vehicleId: truck.vehicleId }, admin.token);
      console.log('Created a clearly labeled synthetic route for the NGO hot-meals truck and Maya.');
    }
  }
  console.log(`Fleet fixtures ready: ${data.vehicles.length} vehicles, ${data.drivers.length} NGO driver accounts. Existing assignments preserved.`);
}
if (require.main === module) seedFleet().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { seedFleet };
