import Lox from "./lox";



function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    console.log("Usage: node index.js <path/to/[filename].lox>");
  } else if (args.length === 1) {
    Lox.runFile(args[0]);
  } else {
    Lox.runPrompt();
  }
}
main();
