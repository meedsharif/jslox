import fs from "fs/promises";
import readline from "readline";
import AstPrinter from "./astPrinter";
import { Expr } from "./expr";
import Interpreter from "./interpreter";
import Parser from "./parser";
import Scanner from "./scanner";

const interpreter = new Interpreter();
function run(content: string) {
  const scanner = new Scanner(content);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  const expressions = parser.parse();

  if (hadError) return;
  if(expressions instanceof Expr) {
    console.log(new AstPrinter().print(expressions));
    // console.log({ expressions })
    interpreter.interpret(expressions);
  }
}

async function runFile(filename: string) {
  const source = await fs.readFile(filename, "utf8");
  run(source);
  if (hadError) {
    process.exit(65);
  }
  if(hadRuntimeError) process.exit(70)
}

function runPrompt() {
  hadError = false;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(">>> ", (source) => {
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
let hadRuntimeError = false;
main();
