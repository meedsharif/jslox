import RuntimeError from "./runtimeError";
import { Token } from "./token";
import TokenType from "./tokenType";

function report(line: number, where: string, message: string) {
  console.log(`${line}:${where}: ${message}`);
}

function error(data: Token | number, message: string) {
  if (typeof data === "object") {
    const token = data as Token;
    if(token.type === TokenType.EOF) {
      report(token.line, " at end", message);
    } else {
      report(token.line, ` at '${token.lexeme}'`, message);
    }
  } else {
    const line = data as number;
    report(line, "", message);
  }
}

function runtimeError(error: RuntimeError) {
  console.log(`${error.message} \n at line ${error.token.line}`);
}

export { error, runtimeError };
