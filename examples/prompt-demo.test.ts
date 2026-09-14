import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("uses the typed answer when input is provided", () => {
  const result = spawnSync("node", ["examples/prompt-demo.ts"], {
    encoding: "utf8",
    input: "Alice\n",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /hello, Alice!/);
});

test("falls back to the default when input is empty", () => {
  const result = spawnSync("node", ["examples/prompt-demo.ts"], {
    encoding: "utf8",
    input: "\n",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /hello, opsc!/);
});
