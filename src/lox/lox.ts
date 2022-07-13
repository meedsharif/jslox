import fs from 'fs/promises';
import readline from 'readline';
import AstPrinter from './astPrinter';
import { Expr } from './expr';
import Interpreter from './interpreter';
import Parser from './parser';
import RuntimeError from './runtimeError';
import Scanner from './scanner';
import { Token } from './token';
import TokenType from './tokenType';

let hadError = false;
let hadRuntimeError = false;
let interpreter = new Interpreter();
class Lox {

  static report(line: number, where: string, message: string) {
    console.log(`${line}:${where}: ${message}`);
    hadError = true;
  }

  static error(data: Token | number, message: string) {
    if (typeof data === "object") {
      const token = data as Token;
      if(token.type === TokenType.EOF) {
        Lox.report(token.line, " at end", message);
      } else {
        Lox.report(token.line, ` at '${token.lexeme}'`, message);
      }
    } else {
      const line = data as number;
      Lox.report(line, "", message);
    }
  }
  
  static runtimeError(error: RuntimeError) {
    console.log(`${error.message} \n at line ${error.token.line}`);
    hadRuntimeError = true;
  }


  static async runFile(filename: string) {
    const source = await fs.readFile(filename, "utf8");
    Lox.run(source);
    if (hadError) {
      process.exit(65);
    }
    if(hadRuntimeError) process.exit(70)
  }

  static runPrompt() {
    hadError = false;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(">>> ", (source) => {
      if (source === "exit()") {
        process.exit(0)
      }
      Lox.run(source);
      rl.close();
      Lox.runPrompt();
    });
  }

  static run(content: string) {
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
}

export default Lox;