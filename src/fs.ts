import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface TempDir {
  path: string;
  cleanup: () => void;
}

export function makeTempDir(prefix: string): TempDir {
  const path = mkdtempSync(join(tmpdir(), prefix));
  return {
    path,
    cleanup: () => rmSync(path, { recursive: true, force: true }),
  };
}

export async function withTempDir<T>(
  prefix: string,
  fn: (path: string) => Promise<T>
): Promise<T> {
  const dir = makeTempDir(prefix);
  try {
    return await fn(dir.path);
  } finally {
    dir.cleanup();
  }
}
