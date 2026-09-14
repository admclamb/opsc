import { promptText, closePrompts } from "../src/prompt.ts";

const a = await promptText("first", "d1");
const b = await promptText("second", "d2");
const c = await promptText("third", "d3");

console.log(`${a},${b},${c}`);
closePrompts();
