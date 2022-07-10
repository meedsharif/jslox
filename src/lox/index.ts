import fs from "fs/promises";
import readline from "readline";
import Scanner from "./scanner";

function run(content: string) {
  const scanner = new Scanner(content);
  const tokens = scanner.scanTokens();

  console.log(tokens);
}

async function runFile(filename: string) {
  const source = await fs.readFile(filename, "utf8");
  run(source);
  if (hadError) {
    process.exit(65);
  }
}

function runPrompt() {
  hadError = false;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("> ", (source) => {
    run(source);
    rl.close();
    if (source !== "exit()") {
      runPrompt();
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    console.log("Usage: node index.js <path/to/[filename].lox>");
  } else if (args.length === 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

let hadError = false;
main();
