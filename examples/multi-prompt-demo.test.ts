import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("sequential prompts in one process each get the correct line, none lost to buffering", () => {
  const result = spawnSync("node", ["examples/multi-prompt-demo.ts"], {
    encoding: "utf8",
    input: "Alice\n\nGamma\n",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Alice,d2,Gamma/);
});

test("all-default sequential prompts resolve without hanging", () => {
  const result = spawnSync("node", ["examples/multi-prompt-demo.ts"], {
    encoding: "utf8",
    input: "\n\n\n",
    timeout: 5000,
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /d1,d2,d3/);
});
