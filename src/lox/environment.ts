import RuntimeError from "./runtimeError";
import { Token } from "./token";

type value = string | number | boolean | null;

class Environment {
  private values = new Map<string, value>();

  public define(name: string, value: value): void {
    this.values.set(name, value);
  }

  public get(name: Token): value | undefined {
    if(this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }
    
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}

export default Environment;