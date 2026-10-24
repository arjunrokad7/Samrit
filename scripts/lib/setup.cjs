const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");

function checkNode(version = process.versions.node) {
  const [major, minor] = version.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error(
      `Node.js 22.12+ is required; found ${version}. Install the Node 22 LTS release, then retry.`,
    );
}
function checkNpm(version) {
  if (!/^\d+\./.test(version || "") || Number(version.split(".")[0]) < 10)
    throw new Error(
      `npm 10+ is required; found ${version || "no npm installation"}.`,
    );
}
function npmVersion() {
  const match = (process.env.npm_config_user_agent || "").match(
    /npm\/(\d+\.\d+\.\d+)/,
  );
  if (match) return match[1];
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["--version"],
    { encoding: "utf8", shell: process.platform === "win32", timeout: 5000 },
  );
  return result.status === 0 ? result.stdout.trim() : "";
}
function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
        return match
          ? [[match[1], match[2].replace(/^(['"])(.*)\1$/, "$2")]]
          : [];
      }),
  );
}
function writeNew(file, text) {
  try {
    fs.writeFileSync(file, text, { flag: "wx", mode: 0o600 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}
function createEnvironments(root) {
  const rootFile = path.join(root, ".env");
  const backendFile = path.join(root, "backend/.env");
  // Existing configuration is the source of truth. Never replace it.
  const existing = fs.existsSync(backendFile)
    ? fs.readFileSync(backendFile, "utf8")
    : fs.existsSync(rootFile)
      ? fs.readFileSync(rootFile, "utf8")
      : null;
  const replacements = {
    JWT_SECRET: randomBytes(48).toString("base64url"),
    SUPER_ADMIN_PASSWORD: randomBytes(18).toString("base64url"),
    PGADMIN_PASSWORD: randomBytes(18).toString("base64url"),
  };
  const generated =
    existing ??
    fs
      .readFileSync(path.join(root, ".env.example"), "utf8")
      .replace(
        /^(JWT_SECRET|SUPER_ADMIN_PASSWORD|PGADMIN_PASSWORD)=.*$/gm,
        (_, key) => `${key}=${replacements[key]}`,
      );
  const result = [
    { file: ".env", created: writeNew(rootFile, generated) },
    { file: "backend/.env", created: writeNew(backendFile, generated) },
    {
      file: "frontend/.env",
      created: writeNew(
        path.join(root, "frontend/.env"),
        fs.readFileSync(path.join(root, "frontend/.env.example"), "utf8"),
      ),
    },
  ];
  return result;
}
function npm(args, cwd) {
  const cli = process.env.npm_execpath;
  const command =
    cli && fs.existsSync(cli)
      ? process.execPath
      : process.platform === "win32"
        ? "npm.cmd"
        : "npm";
  const argumentsList = cli && fs.existsSync(cli) ? [cli, ...args] : args;
  const result = spawnSync(command, argumentsList, {
    cwd,
    stdio: "inherit",
    shell: !cli && process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `npm ${args.join(" ")} failed in ${path.basename(cwd)} (exit ${result.status}).`,
    );
}
module.exports = {
  checkNode,
  checkNpm,
  npmVersion,
  createEnvironments,
  readEnv,
  npm,
};
