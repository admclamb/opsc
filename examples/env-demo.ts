import { requireEnv } from "../src/env.ts";

const env = {
  DEMO_NAME: requireEnv("DEMO_NAME"),
  DEMO_GREETING: requireEnv("DEMO_GREETING"),
};

console.log(`${env.DEMO_GREETING}, ${env.DEMO_NAME}!`);
