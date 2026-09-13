import { execFileSync, spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const binary = "dist/env-demo-smoke.exe";

execFileSync("scriptc", ["build", "examples/env-demo.ts", "-o", binary], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, SCRIPTC_CC: "zigcc" },
});

const { DEMO_NAME, DEMO_GREETING, ...envWithoutDemoVars } = process.env;

const missing = spawnSync(binary, {
  encoding: "utf8",
  env: envWithoutDemoVars,
});
assert.equal(missing.status, 1);
assert.match(missing.stderr, /Missing required environment variable: DEMO_NAME/);

const ok = spawnSync(binary, {
  encoding: "utf8",
  env: { ...process.env, DEMO_NAME: "opsc", DEMO_GREETING: "hello" },
});
assert.equal(ok.status, 0);
assert.equal(ok.stdout.trim(), "hello, opsc!");

console.log("scriptc smoke test passed against the compiled binary");
