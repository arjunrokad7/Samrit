// Compatibility entry point: all demo drivers are now provisioned by central NGO.
const { seed } = require('./seed-samrit.cjs');
const { seedFleet } = require('./seed-fleet.cjs');
seed().then(() => seedFleet()).catch(error => { console.error(error); process.exitCode = 1; });
