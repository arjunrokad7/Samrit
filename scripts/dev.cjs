const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.join(__dirname, "..");
for(const file of ['migrate.cjs','backfill.cjs']){const result=spawnSync(process.execPath,[path.join(root,'scripts/db',file)],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const children = [
  spawn(
    process.execPath,
    ["-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/main.ts"],
    { cwd: path.join(root, "backend"), stdio: "inherit" },
  ),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    { cwd: path.join(root, "frontend"), stdio: "inherit" },
  ),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) => {
  child.on("error", (error) => {
    console.error(error);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (!stopping && code) {
      process.exitCode = code;
      stop();
    }
  });
});
