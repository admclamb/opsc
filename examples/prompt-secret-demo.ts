import { promptSecret, closePrompts } from "../src/prompt.ts";

const secret = await promptSecret("Enter your API key");
console.log(`received ${secret.length} characters`);
closePrompts();
