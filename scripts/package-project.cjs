const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { createHash } = require("node:crypto");

const ROOT_FILES = new Set([
  "package.json",
  "package-lock.json",
  "project.requirements.json",
  ".nvmrc",
  ".env.example",
  ".gitignore",
  ".dockerignore",
  "docker-compose.yml",
  "README.md",
  "START_HERE.md",
  "SETUP_FOR_AI.md",
  "API_CONTRACT.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "Testing Docs.docx",
]);
const SOURCE_DIRS = new Set([
  "database",
  "backend",
  "frontend",
  "shared",
  "scripts",
  "docs",
  ".github",
  "images",
]);
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".tools",
  ".venv",
  "venv",
  "__pycache__",
  "dist",
  "build",
  "coverage",
  "uploads",
  "private_documents",
  ".screenshots",
  "releases",
  "backups",
  "postgres_data",
  "mongo-data",
  "playwright-report",
  "test-results",
  ".cache",
  ".vite",
  ".idea",
  ".vscode",
  ".aws",
  ".codex",
]);
function excludedFile(name) {
  const lower = name.toLowerCase();
  return (
    (lower.startsWith(".env") && lower !== ".env.example") ||
    /\.(log|zip|7z|tar|gz|pyc|pyo|exe|dll|msi|whl|sqlite|sqlite3|db|dump|pem|key|pfx|tsbuildinfo)$/i.test(
      name,
    ) ||
    /^(credentials(?:\..*)?|\.ds_store|thumbs\.db)$/i.test(name)
  );
}
function collectFiles(root) {
  const result = [];
  function walk(directory, relative = "") {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      const file = path.join(directory, entry.name);
      const portable = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (
          EXCLUDED_DIRS.has(entry.name.toLowerCase()) ||
          (!relative && !SOURCE_DIRS.has(entry.name))
        )
          continue;
        walk(file, portable);
      } else if (
        entry.isFile() &&
        !excludedFile(entry.name) &&
        (relative || ROOT_FILES.has(entry.name))
      ) {
        if (fs.statSync(file).size > 25 * 1024 * 1024)
          throw new Error(
            `Unexpected source file over 25 MB: ${portable}. Review it before sharing.`,
          );
        result.push({ name: portable, data: fs.readFileSync(file) });
      }
    }
  }
  walk(root);
  return result;
}
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let i = 0; i < 8; i++)
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const value of data) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makeZip(entries, date = new Date()) {
  const files = [];
  const central = [];
  let offset = 0;
  const time =
    (date.getUTCHours() << 11) |
    (date.getUTCMinutes() << 5) |
    (date.getUTCSeconds() >> 1);
  const day =
    ((Math.max(1980, date.getUTCFullYear()) - 1980) << 9) |
    ((date.getUTCMonth() + 1) << 5) |
    date.getUTCDate();
  if (entries.length > 65535)
    throw new Error("Too many files for a source ZIP.");
  for (const entry of entries) {
    if (
      entry.name.includes("\\") ||
      entry.name.startsWith("/") ||
      entry.name.split("/").includes("..")
    )
      throw new Error("Invalid archive path.");
    const name = Buffer.from(`samrit/${entry.name}`, "utf8");
    const compressed = zlib.deflateRawSync(entry.data, { level: 9 });
    const crc = crc32(entry.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(day, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(time, 12);
    record.writeUInt16LE(day, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(entry.data.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    files.push(header, name, compressed);
    central.push(record, name);
    offset += header.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, directory, end]);
}
function packageProject(root) {
  const entries = collectFiles(root);
  const required = [
    "THIRD_PARTY_NOTICES.md",
    "START_HERE.md",
    "SETUP_FOR_AI.md",
    "project.requirements.json",
    "package.json",
    "package-lock.json",
    "backend/package.json",
    "backend/package-lock.json",
    "frontend/package.json",
    "frontend/package-lock.json",
    ".env.example",
    "frontend/.env.example",
    "shared/types/samrit.ts",
  ];
  for (const name of required)
    if (!entries.some((entry) => entry.name === name))
      throw new Error(`Required handoff file missing: ${name}`);
  const manifest = {
    schemaVersion: 1,
    project: "Samrit",
    createdAt: new Date().toISOString(),
    restore: "npm run setup",
    files: entries.map((entry) => ({
      path: entry.name,
      bytes: entry.data.length,
      sha256: createHash("sha256").update(entry.data).digest("hex"),
    })),
  };
  entries.push({
    name: "HANDOFF_MANIFEST.json",
    data: Buffer.from(JSON.stringify(manifest, null, 2) + "\n"),
  });
  const zip = makeZip(entries);
  const directory = path.join(root, "releases");
  fs.mkdirSync(directory, { recursive: true });
  const output = path.join(directory, "samrit-team.zip");
  const temporary = `${output}.tmp`;
  fs.writeFileSync(temporary, zip);
  fs.renameSync(temporary, output);
  const checksum = createHash("sha256").update(zip).digest("hex");
  fs.writeFileSync(`${output}.sha256`, `${checksum}  samrit-team.zip\n`);
  console.log(
    `Created ${output}\n${entries.length} files; ${(zip.length / 1024 / 1024).toFixed(2)} MB.\nExcluded installed dependencies, local tools, .env credentials, databases, uploads, builds, and Git history.\nSHA256: ${checksum}`,
  );
  return { output, entries, checksum };
}
module.exports = { collectFiles, makeZip, crc32, packageProject };
if (require.main === module) {
  try {
    packageProject(path.resolve(__dirname, ".."));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
