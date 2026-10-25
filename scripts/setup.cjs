const path = require("node:path");
const fs = require("node:fs");
const {
  checkNode,
  checkNpm,
  npmVersion,
  createEnvironments,
  npm,
} = require("./lib/setup.cjs");
const root = path.resolve(__dirname, "..");
try {
  const supported = new Set(["--skip-install"]);
  const args = process.argv.slice(2);
  if (args.some((arg) => !supported.has(arg)))
    throw new Error("Usage: npm run setup [-- --skip-install]");
  checkNode();
  checkNpm(npmVersion());
  const requirements = JSON.parse(
    fs.readFileSync(path.join(root, "project.requirements.json"), "utf8"),
  );
  for (const entry of requirements.packages) {
    for (const file of [entry.manifest, entry.lockfile])
      if (!fs.existsSync(path.join(root, file)))
        throw new Error(
          `Missing ${file}. Extract the complete project, including shared/ and lockfiles.`,
        );
  }
  for (const result of createEnvironments(root))
    console.log(`${result.created ? "Created" : "Preserved"} ${result.file}`);
  if (!args.includes("--skip-install")) {
    for (const entry of requirements.packages) {
      console.log(`\nInstalling locked ${entry.directory} dependencies...`);
      npm(["ci"], path.join(root, entry.directory));
    }
  }
  console.log(
    "\nSetup complete. Each teammate has local environment files; existing files were preserved.",
  );
  console.log(
    "Admin credentials: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in backend/.env (not printed or included in the share ZIP).",
  );
  console.log(
    "Next: npm run infra:up, npm run doctor -- --services, npm run db:migrate, npm run db:seed, npm run dev",
  );
  console.log("Then, in another terminal: npm run seed:demo");
} catch (error) {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
}
