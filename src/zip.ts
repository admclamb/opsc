import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

function deflateRaw(data: Uint8Array): Buffer {
  const wrapped = deflateSync(data);
  return wrapped.subarray(2, wrapped.length - 4);
}
import { join, relative } from "node:path";

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function listFiles(dir: string): string[] {
  const result: string[] = [];
  const names = readdirSync(dir);
  for (const name of names) {
    const fullPath = join(dir, name);
    if (statSync(fullPath).isDirectory()) {
      result.push(...listFiles(fullPath));
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

function dosDateTime(mtime: Date): { time: number; date: number } {
  const time =
    (mtime.getHours() << 11) |
    (mtime.getMinutes() << 5) |
    Math.floor(mtime.getSeconds() / 2);
  const date =
    ((mtime.getFullYear() - 1980) << 9) |
    ((mtime.getMonth() + 1) << 5) |
    mtime.getDate();
  return { time, date };
}

function localFileHeader(
  nameBytes: Buffer,
  crc: number,
  compressedSize: number,
  uncompressedSize: number,
  method: number,
  time: number,
  date: number
): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(method, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressedSize, 18);
  header.writeUInt32LE(uncompressedSize, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, nameBytes]);
}

function centralDirectoryHeader(
  nameBytes: Buffer,
  crc: number,
  compressedSize: number,
  uncompressedSize: number,
  method: number,
  time: number,
  date: number,
  localHeaderOffset: number
): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(method, 10);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(date, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(compressedSize, 20);
  header.writeUInt32LE(uncompressedSize, 24);
  header.writeUInt16LE(nameBytes.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE((0o100644 << 16) >>> 0, 38);
  header.writeUInt32LE(localHeaderOffset, 42);
  return Buffer.concat([header, nameBytes]);
}

function endOfCentralDirectory(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number
): Buffer {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(0, 4);
  record.writeUInt16LE(0, 6);
  record.writeUInt16LE(entryCount, 8);
  record.writeUInt16LE(entryCount, 10);
  record.writeUInt32LE(centralDirectorySize, 12);
  record.writeUInt32LE(centralDirectoryOffset, 16);
  record.writeUInt16LE(0, 20);
  return record;
}

export function createZip(sourceDir: string, destPath: string): void {
  const files = listFiles(sourceDir);
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const filePath of files) {
    const relPath = relative(sourceDir, filePath).split("\\").join("/");
    const nameBytes = Buffer.from(relPath, "utf8");
    const data = readFileSync(filePath);
    const compressed = deflateRaw(data);
    const crc = crc32(data);
    const { time, date } = dosDateTime(new Date(statSync(filePath).mtimeMs));

    const local = localFileHeader(nameBytes, crc, compressed.length, data.length, 8, time, date);
    localChunks.push(local, compressed);

    const central = centralDirectoryHeader(
      nameBytes,
      crc,
      compressed.length,
      data.length,
      8,
      time,
      date,
      offset
    );
    centralChunks.push(central);

    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const eocd = endOfCentralDirectory(files.length, centralDirectory.length, offset);

  writeFileSync(destPath, Buffer.concat([...localChunks, centralDirectory, eocd]));
}
