import { test } from "node:test";
import assert from "node:assert/strict";
import { commandExists, run } from "./exec.ts";

test("commandExists finds a real command", () => {
  assert.equal(commandExists("node"), true);
});

test("commandExists returns false for a nonexistent command", () => {
  assert.equal(commandExists("definitely-not-a-real-command-xyz"), false);
});

test("run succeeds silently on exit code 0", () => {
  assert.doesNotThrow(() => run("node", ["--version"]));
});

test("run throws with captured output on a nonzero exit", () => {
  assert.throws(
    () => run("node", ["-e", "console.error('boom'); process.exit(3)"]),
    /exited with status 3[\s\S]*boom/
  );
});
