import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { withTempDir } from "../src/fs.ts";
import { createZip } from "../src/zip.ts";

const destPath = "dist/zip-demo.zip";

await withTempDir("opsc-zip-demo-", async (sourceDir) => {
  writeFileSync(join(sourceDir, "hello.txt"), "hello from opsc zip demo");
  mkdirSync(join(sourceDir, "nested"));
  writeFileSync(join(sourceDir, "nested", "inner.txt"), "nested file contents");
  createZip(sourceDir, destPath);
});

console.log(destPath);
