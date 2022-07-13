import readline from 'readline';
import Lox from "./lox";

function respondToKBCombos() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', (str, key) => {
    // if(key.ctrl && key.name === 'a') {
    //   process.exit(0);
    // }
  })
}

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
