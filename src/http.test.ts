import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { postBinary } from "./http.ts";

async function withTestServer<T>(
  handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void,
  fn: (url: string) => Promise<T>
): Promise<T> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind a port");
  }
  try {
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
  }
}

test("sends the body, content type, and basic auth header correctly", async () => {
  let receivedAuth = "";
  let receivedContentType = "";
  let receivedBody = Buffer.alloc(0);

  await withTestServer(
    (req, res) => {
      receivedAuth = req.headers.authorization ?? "";
      receivedContentType = req.headers["content-type"] ?? "";
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        receivedBody = Buffer.concat(chunks);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
      });
    },
    async (url) => {
      const response = await postBinary(url, Buffer.from("payload bytes"), "application/octet-stream", {
        username: "alice",
        password: "s3cret",
      });
      assert.equal(response, "ok");
    }
  );

  assert.equal(receivedAuth, `Basic ${Buffer.from("alice:s3cret").toString("base64")}`);
  assert.equal(receivedContentType, "application/octet-stream");
  assert.equal(receivedBody.toString("utf8"), "payload bytes");
});

test("throws with status and body when the server responds with an error", async () => {
  await withTestServer(
    (_req, res) => {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("unauthorized");
    },
    async (url) => {
      await assert.rejects(
        postBinary(url, Buffer.from("x"), "application/octet-stream", { username: "a", password: "b" }),
        /failed with status 401: unauthorized/
      );
    }
  );
});
