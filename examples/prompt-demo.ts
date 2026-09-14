import { promptText, closePrompts } from "../src/prompt.ts";

const name = await promptText("What's your name", "opsc");
console.log(`hello, ${name}!`);
closePrompts();
