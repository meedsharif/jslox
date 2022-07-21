import Environment from "./environment";
import Interpreter from "./interpreter";
import LoxCallable from "./loxCallable";
import { Function } from "./stmt";

class LoxFunction implements LoxCallable {
  private declaration: Function;
  constructor(declaration: Function) {
    this.declaration = declaration;
  }

  call(interpreter: Interpreter, args: any[]) {
    const environment = new Environment(interpreter.globals);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }
    interpreter.executeBlock(this.declaration.body, environment);
  }

  arity(): number {
      return this.declaration.params.length;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

export default LoxFunction;