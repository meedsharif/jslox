import Interpreter from "./interpreter";

interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
}

export default LoxCallable;