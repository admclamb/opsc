import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("exits 1 with a clear message when a required variable is missing", () => {
  const { DEMO_NAME, DEMO_GREETING, ...envWithoutDemoVars } = process.env;
  const result = spawnSync("node", ["examples/env-demo.ts"], {
    encoding: "utf8",
    env: envWithoutDemoVars,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required environment variable: DEMO_NAME/);
});

test("prints the greeting when both variables are set", () => {
  const result = spawnSync("node", ["examples/env-demo.ts"], {
    encoding: "utf8",
    env: { ...process.env, DEMO_NAME: "opsc", DEMO_GREETING: "hello" },
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "hello, opsc!");
});
