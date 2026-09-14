import { createInterface } from "node:readline";

let buffer = "";
let pumpStarted = false;
let pumpDone = false;
let waiters: Array<() => void> = [];

function notifyWaiters(): void {
  const toNotify = waiters;
  waiters = [];
  for (const resolve of toNotify) {
    resolve();
  }
}

function waitForMore(): Promise<void> {
  return new Promise((resolve) => {
    waiters.push(resolve);
  });
}

async function pump(): Promise<void> {
  try {
    for await (const chunk of process.stdin) {
      buffer += Buffer.from(chunk).toString("utf8");
      notifyWaiters();
    }
  } catch {
  }
  pumpDone = true;
  notifyWaiters();
}

function ensurePumpStarted(): void {
  if (pumpStarted) {
    return;
  }
  pumpStarted = true;
  pump();
}

async function readPipedLine(): Promise<string | undefined> {
  ensurePumpStarted();
  while (true) {
    const newlineIndex = buffer.indexOf("\n");
    if (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      return line.endsWith("\r") ? line.slice(0, -1) : line;
    }
    if (pumpDone) {
      if (buffer.length > 0) {
        const remaining = buffer;
        buffer = "";
        return remaining;
      }
      return undefined;
    }
    await waitForMore();
  }
}

async function readChar(): Promise<string | undefined> {
  ensurePumpStarted();
  while (buffer.length === 0) {
    if (pumpDone) {
      return undefined;
    }
    await waitForMore();
  }
  const char = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  return char;
}

function readInteractiveLine(query: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function promptText(message: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const query = `${message}${suffix}: `;

  let answer: string;
  if (process.stdin.isTTY) {
    answer = await readInteractiveLine(query);
  } else {
    process.stdout.write(query);
    answer = (await readPipedLine()) ?? "";
  }

  return answer.trim() === "" ? defaultValue ?? "" : answer;
}

export function closePrompts(): void {
  process.stdin.destroy();
}

const CTRL_C = String.fromCharCode(3);
const DEL = String.fromCharCode(127);

export async function promptSecret(message: string, defaultValue?: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return promptText(message, defaultValue);
  }

  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  process.stdout.write(`${message}${suffix}: `);
  process.stdin.setRawMode(true);

  let value = "";

  while (true) {
    const char = await readChar();
    if (char === undefined || char === "\r" || char === "\n") {
      break;
    } else if (char === CTRL_C) {
      process.stdin.setRawMode(false);
      process.exit(130);
    } else if (char === DEL || char === "\b") {
      if (value.length > 0) {
        value = value.slice(0, -1);
        process.stdout.write("\b \b");
      }
    } else {
      value += char;
      process.stdout.write("*");
    }
  }

  process.stdin.setRawMode(false);
  process.stdout.write("\n");
  return value.trim() === "" ? defaultValue ?? "" : value;
}
