import { commandExists, run } from "../src/exec.ts";

console.log(commandExists("node") ? "node found" : "node not found");
console.log(commandExists("definitely-not-a-real-command-xyz") ? "found" : "not found");

run("node", ["--version"]);
console.log("run succeeded");
