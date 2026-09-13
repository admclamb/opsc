import { requireEnv } from "../src/env.ts";
import { postBinary } from "../src/http.ts";

const url = requireEnv("HTTP_DEMO_URL");

const response = await postBinary(url, Buffer.from("hello from opsc http demo"), "application/octet-stream", {
  username: "demo-user",
  password: "demo-pass",
});

console.log(response);
