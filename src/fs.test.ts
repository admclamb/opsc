import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { makeTempDir, withTempDir } from "./fs.ts";

test("makeTempDir creates a real, unique directory", () => {
  const dir = makeTempDir("opsc-test-");
  assert.ok(existsSync(dir.path));
  dir.cleanup();
});

test("makeTempDir's cleanup removes the directory", () => {
  const dir = makeTempDir("opsc-test-");
  dir.cleanup();
  assert.equal(existsSync(dir.path), false);
});

test("withTempDir cleans up after the callback succeeds", async () => {
  let capturedPath = "";
  const result = await withTempDir("opsc-test-", async (path) => {
    capturedPath = path;
    return "done";
  });
  assert.equal(result, "done");
  assert.equal(existsSync(capturedPath), false);
});

test("withTempDir cleans up even when the callback throws", async () => {
  let capturedPath = "";
  await assert.rejects(
    withTempDir("opsc-test-", async (path) => {
      capturedPath = path;
      throw new Error("boom");
    }),
    /boom/
  );
  assert.equal(existsSync(capturedPath), false);
});
