import { runtimeError } from './error';
import { Binary, Expr, Grouping, Literal, Unary } from './expr';
import RuntimeError from './runtimeError';
import { Token } from './token';
import TokenType from './tokenType';

class Interpreter {

  interpret(expression: Expr) {
    try {
      let value = this.evaluate(expression);
      console.log(value);
    } catch (error) {
      console.log(error);
      if(error instanceof RuntimeError) {
        runtimeError(error);
      }
    }
  }

  visitLiteralExpr(expr: Literal): Object {
    return expr.value;
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
}

export default Interpreter;