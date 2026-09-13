import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { withTempDir } from "../src/fs.ts";

let dirDuringUse = "";

const contents = await withTempDir("opsc-fs-demo-", async (dir) => {
  dirDuringUse = dir;
  const filePath = join(dir, "hello.txt");
  writeFileSync(filePath, "hello from opsc fs demo");
  return readFileSync(filePath, "utf8");
});

console.log(contents);
console.log(existsSync(dirDuringUse) ? "temp dir still exists" : "temp dir cleaned up");
