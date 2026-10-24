const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawnSync } = require("node:child_process");
const { checkNode, checkNpm, npmVersion, readEnv } = require("./lib/setup.cjs");
const root = path.resolve(__dirname, "..");
let failures = 0;
function report(ok, message, required = true) {
  console.log(`${ok ? "OK" : required ? "MISSING" : "NOTE"}  ${message}`);
  if (!ok && required) failures++;
}
function port(host, value) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: Number(value) });
    let finished = false;
    const done = (ok) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2000);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}
(async () => {
  try {
    checkNode();
    report(true, `Node ${process.versions.node}`);
  } catch (error) {
    report(false, error.message);
  }
  try {
    const version = npmVersion();
    checkNpm(version);
    report(true, `npm ${version}`);
  } catch (error) {
    report(false, error.message);
  }
  for (const folder of ["backend", "frontend"]) {
    report(
      fs.existsSync(path.join(root, folder, "package-lock.json")),
      `${folder}/package-lock.json`,
    );
    report(
      fs.existsSync(path.join(root, folder, "node_modules")),
      `${folder} dependencies (npm run setup)`,
    );
    report(
      fs.existsSync(path.join(root, folder, ".env")),
      `${folder}/.env (npm run setup)`,
    );
  }
  const config = {
    ...readEnv(path.join(root, ".env")),
    ...readEnv(path.join(root, "backend/.env")),
  };
  report(
    !!config.JWT_SECRET && !config.JWT_SECRET.startsWith("replace-"),
    "JWT secret configured; value omitted",
  );
  report(
    !!config.SUPER_ADMIN_PASSWORD &&
      !config.SUPER_ADMIN_PASSWORD.startsWith("replace-"),
    "Admin password configured; value omitted",
  );
  const docker = spawnSync("docker", ["compose", "version"], {
    encoding: "utf8",
    timeout: 5000,
  });
  report(
    docker.status === 0,
    docker.status === 0
      ? "Docker Compose available"
      : "Docker Compose not installed; native PostgreSQL/Redis can be used instead",
    false,
  );
  const requireServices = process.argv.includes("--services");
  for (const [label, host, value] of [
    [
      "PostgreSQL",
      config.DATABASE_HOST || "127.0.0.1",
      config.DATABASE_PORT || 5432,
    ],
    ["Redis", config.REDIS_HOST || "127.0.0.1", config.REDIS_PORT || 6379],
  ])
    report(
      await port(host, value),
      `${label} reachable at ${host}:${value}`,
      requireServices,
    );
  console.log(
    "Python is not required. No portable runtimes or database files need to be copied.",
  );
  process.exitCode = failures ? 1 : 0;
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
