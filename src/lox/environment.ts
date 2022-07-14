import RuntimeError from "./runtimeError";
import { Token } from "./token";

type value = string | number | boolean | null;

class Environment {
  enclosing: Environment | null;
  private values = new Map<string, value>();

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  public define(name: string, value: value): void {
    this.values.set(name, value);
  }

  public get(name: Token): value | undefined {
    if(this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if(this.enclosing) return this.enclosing.get(name);
    
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public assign(name: Token, value: value): void {
    if(this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if(this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}

export default Environment;