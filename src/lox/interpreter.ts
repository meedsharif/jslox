import Environment from './environment';
import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from './expr';
import Lox from './lox';
import LoxCallable from './loxCallable';
import RuntimeError from './runtimeError';
import { Block, Expression, If, Print, Stmt, Var, While } from './stmt';
import { Token } from './token';
import TokenType from './tokenType';

class Interpreter {

  private globals = new Environment();
  private environment = this.globals;

  constructor() {
    this.globals.define("clock", new Callable(0, () => { return Date.now(); }));
  }

  interpret(statements: Stmt[]) {
    try {
      for (let statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if(error instanceof RuntimeError) {
        Lox.runtimeError(error);
      }
    }
  }

  visitLiteralExpr(expr: Literal): Object {
    return expr.value;
  }

  visitLogicalExpr(expr: Logical) {
    let left = this.evaluate(expr.left);

    if(expr.operator.type === TokenType.OR) {
      if(this.isTruthy(left)) return left;
    } else {
      if(!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitUnaryExpr(expr: Unary): Object | null {
    let right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -parseFloat(right);
    }

    return null;
  }

  visitVariableExpr(expr: Variable) {
    return this.environment.get(expr.name);
  }

  visitAssignExpr(expr: Assign) {
    let value = this.evaluate(expr.value);

    this.environment.assign(expr.name, value);
    
    return value;
  }

  private checkNumberOperand(operator: Token, operand: any): void {
    if (typeof operand !== "number") {
      throw new RuntimeError(operator, "Operand must be a number.");
    }
  }

  private checkNumberOperands(operator: Token, left: any, right: any): void {
    if (typeof left !== "number" || typeof right !== "number") {
      throw new RuntimeError(operator, "Operands must be numbers.");
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private isEqual(a: any, b: any): boolean {
    if(a === null && b === null) return true;
    if(a === null) return false;

    return a === b;
  }

  private stringify(value: null | string | number): (string | null)  {
    if (value === null) return null;
    if (typeof value === "number") {
      let text = value.toString();
      if(text.endsWith("0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return value.toString();
  }

  visitGroupingExpr(expr: Grouping): Object {
    return this.evaluate(expr.expression);
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  private executeBlock(statements: Stmt[], environment: Environment) {
    let previous = this.environment;

    try {
      this.environment = environment;

      for(let statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
  }

  visitIfStmt(stmt: If) {
    if(this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: Print) {
    let value = this.evaluate(stmt.expression);
    console.log(value);
  }

  visitVarStmt(stmt: Var) {
    let value = null;

    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);

    return null;
  }

  visitWhileStmt(stmt: While) {
    while(this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitBinaryExpr(expr: Binary): Object | null {
    let left = this.evaluate(expr.left);
    let right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) > parseFloat(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) >= parseFloat(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) < parseFloat(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) <= parseFloat(right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) - parseFloat(right);
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) / parseFloat(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return parseFloat(left) * parseFloat(right);
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }

        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
    }

    return null;
  }

  visitCallExpr(expr: Call): any {
    let callee = this.evaluate(expr.callee);
    let args = expr.args.map(arg => this.evaluate(arg));

    if(typeof callee !== "function") {
      throw new RuntimeError(expr.paren, "Can only call functions and classes.");
    }

    let func: LoxCallable = callee;

    if(args.length !== func.arity()) {
      throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}`);
    }

    return func.call(this, args);
  }
}

class Callable implements LoxCallable {
  private fn;
  private _arity: number;
  constructor(arity: any, fn: Function)  {
    this._arity = arity;
    this.fn = fn;
  }

  arity(): number {
    return this._arity;
  }

  call(interpreter: Interpreter, args: any[]): any {
    return this.fn.apply(null, args);
  }

}

export default Interpreter;