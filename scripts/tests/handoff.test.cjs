const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  checkNode,
  checkNpm,
  createEnvironments,
  readEnv,
} = require("../lib/setup.cjs");
const { collectFiles, crc32, makeZip } = require("../package-project.cjs");

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "samrit-handoff-test-"));
  const write = (name, text) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
  try {
    return run({ root, write });
  } finally {
    const resolved = path.resolve(root);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith("samrit-handoff-test-")
    )
      throw new Error("Refusing cleanup outside this test fixture.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
test("setup rejects unsupported Node versions before installing anything", () => {
  assert.throws(() => checkNode("20.19.0"), /22.12/);
  assert.throws(() => checkNode("22.11.0"), /22.12/);
  assert.doesNotThrow(() => checkNode("22.12.0"));
  assert.doesNotThrow(() => checkNode("24.0.0"));
  assert.throws(() => checkNpm("9.9.0"), /npm 10/);
  assert.doesNotThrow(() => checkNpm("10.0.0"));
});
test("fresh setup generates matching local configuration and does not replace it on rerun", () =>
  fixture(({ root, write }) => {
    write(
      ".env.example",
      "JWT_SECRET=replace-secret\nSUPER_ADMIN_PASSWORD=replace-password\nPGADMIN_PASSWORD=replace-password\n",
    );
    write("frontend/.env.example", "VITE_API_URL=http://localhost:3000\n");
    write("backend/package.json", "{}");
    assert.ok(createEnvironments(root).every((result) => result.created));
    const original = fs.readFileSync(path.join(root, "backend/.env"), "utf8");
    assert.equal(original, fs.readFileSync(path.join(root, ".env"), "utf8"));
    const config = readEnv(path.join(root, "backend/.env"));
    assert.ok(config.JWT_SECRET.length >= 48);
    assert.notEqual(config.SUPER_ADMIN_PASSWORD, "replace-password");
    assert.ok(createEnvironments(root).every((result) => !result.created));
    assert.equal(
      fs.readFileSync(path.join(root, "backend/.env"), "utf8"),
      original,
    );
  }));
test("an existing backend environment is preserved and reused for missing root configuration", () =>
  fixture(({ root, write }) => {
    write(".env.example", "JWT_SECRET=replace-secret\n");
    write("frontend/.env.example", "VITE_APP_CITY=New York City\n");
    write("backend/.env", "JWT_SECRET=existing-local-value\n");
    createEnvironments(root);
    assert.equal(
      readEnv(path.join(root, ".env")).JWT_SECRET,
      "existing-local-value",
    );
    assert.equal(
      readEnv(path.join(root, "backend/.env")).JWT_SECRET,
      "existing-local-value",
    );
  }));
test("ZIP selection includes source/lockfiles but excludes local dependencies, tools, secrets and data", () =>
  fixture(({ root, write }) => {
    const keep = [
      "package.json",
      "backend/package-lock.json",
      "frontend/package-lock.json",
      ".env.example",
      "frontend/.env.example",
      "shared/types/example.ts",
      "frontend/public/brand/logo.png",
      "scripts/fixtures/stage-1.png",
    ];
    const omit = [
      "backend/.env",
      "frontend/.env.production",
      "frontend/node_modules/react/index.js",
      ".tools/python.exe",
      "frontend/dist/index.html",
      "backend/uploads/private.png",
      ".git/config",
      "releases/old.zip",
      "docs/backups/dump.sql",
      "backend/credentials.json",
      "frontend/.env.local",
      ".screenshots/private.png",
    ];
    for (const name of [...keep, ...omit]) write(name, "fixture");
    const names = collectFiles(root).map((entry) => entry.name);
    assert.deepEqual(names.sort(), keep.sort());
  }));
test("ZIP checksum is standard CRC32 and traversal names are rejected", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
  const archive = makeZip([{ name: "README.md", data: Buffer.from("Samrit") }]);
  assert.equal(archive.readUInt32LE(0), 0x04034b50);
  assert.equal(archive.readUInt32LE(archive.length - 22), 0x06054b50);
  assert.throws(
    () => makeZip([{ name: "../outside", data: Buffer.alloc(0) }]),
    /Invalid archive/,
  );
});
