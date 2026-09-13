import { test } from "node:test";
import assert from "node:assert/strict";
import { requireEnv } from "./env.ts";

test("returns the value when the variable is set", () => {
  process.env.OPSC_TEST_VAR = "hello";
  assert.equal(requireEnv("OPSC_TEST_VAR"), "hello");
  delete process.env.OPSC_TEST_VAR;
});
