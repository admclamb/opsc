import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("falls back to plain input when stdin is not a TTY", () => {
  const result = spawnSync("node", ["examples/prompt-secret-demo.ts"], {
    encoding: "utf8",
    input: "sk-abc12345\n",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /received 11 characters/);
});
