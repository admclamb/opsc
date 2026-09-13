import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { join } from "node:path";
import { createZip } from "./zip.ts";
import { withTempDir } from "./fs.ts";

test("creates a zip whose entry round-trips to the original contents", async () => {
  await withTempDir("opsc-zip-test-src-", async (sourceDir) => {
    writeFileSync(join(sourceDir, "hello.txt"), "hello from a test");

    await withTempDir("opsc-zip-test-out-", async (outDir) => {
      const zipPath = join(outDir, "out.zip");
      createZip(sourceDir, zipPath);

      const buf = readFileSync(zipPath);
      assert.equal(buf.readUInt32LE(0), 0x04034b50);

      const nameLength = buf.readUInt16LE(26);
      const compressedSize = buf.readUInt32LE(18);
      const name = buf.subarray(30, 30 + nameLength).toString("utf8");
      assert.equal(name, "hello.txt");

      const dataStart = 30 + nameLength;
      const compressed = buf.subarray(dataStart, dataStart + compressedSize);
      const inflated = inflateRawSync(compressed).toString("utf8");
      assert.equal(inflated, "hello from a test");
    });
  });
});

test("stores nested files with forward-slash relative paths", async () => {
  await withTempDir("opsc-zip-test-src-", async (sourceDir) => {
    mkdirSync(join(sourceDir, "nested"));
    writeFileSync(join(sourceDir, "nested", "inner.txt"), "nested contents");

    await withTempDir("opsc-zip-test-out-", async (outDir) => {
      const zipPath = join(outDir, "out.zip");
      createZip(sourceDir, zipPath);

      const buf = readFileSync(zipPath);
      const nameLength = buf.readUInt16LE(26);
      const name = buf.subarray(30, 30 + nameLength).toString("utf8");
      assert.equal(name, "nested/inner.txt");
    });
  });
});

test("end of central directory records the correct entry count", async () => {
  await withTempDir("opsc-zip-test-src-", async (sourceDir) => {
    writeFileSync(join(sourceDir, "a.txt"), "a");
    writeFileSync(join(sourceDir, "b.txt"), "b");

    await withTempDir("opsc-zip-test-out-", async (outDir) => {
      const zipPath = join(outDir, "out.zip");
      createZip(sourceDir, zipPath);

      const buf = readFileSync(zipPath);
      const eocdOffset = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
      assert.notEqual(eocdOffset, -1);
      assert.equal(buf.readUInt16LE(eocdOffset + 10), 2);
    });
  });
});
