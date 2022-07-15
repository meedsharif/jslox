import { Assign, Binary, Expr, Grouping, Literal, Unary, Variable } from "./expr";
import Lox from "./lox";
import { Block, Expression, If, Print, Stmt, Var } from "./stmt";
import { Token } from "./token";
import TokenType from "./tokenType";

class ParseError extends Error {

}

class Parser {
  private current: number = 0;
  private tokens: Token[] = [];
  

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): any[] {
    let statements = new Array<any>();

    while(!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private statement(): Stmt {
    if(this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if(this.match(TokenType.PRINT)) {
      return this.printStatement();
    }

    if(this.match(TokenType.LEFT_BRACE)) {
      return new Block(this.block());
    }

    return this.expressionStatement();
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if' statement. ");
    let condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    let thenBranch = this.statement();
    let elseBranch: Stmt | void;
    if(this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch!);
  }

  private printStatement(): Stmt {
    let value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private varDeclaration(): Stmt | void {
    let name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    let initializer;

    if(this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    if(initializer instanceof Expr) {
      return new Var(name, initializer);
    }
  }

  private expressionStatement(): Stmt {
    let expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private block() {
    let statements = new Array<any>();

    while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private assignment(): Expr {
    let expr = this.equality();

    if(this.match(TokenType.EQUAL)) {
      let equals = this.previous();
      let value = this.assignment();
      if(expr instanceof Variable) {
        return new Assign(expr.name, value);
      }
      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private declaration(): Stmt | void {
      try {
        if (this.match(TokenType.VAR)) {
          return this.varDeclaration();
        }

        return this.statement();
      } catch (e) {
        if(e instanceof ParseError) {
          this.synchronize();
        }
      }
  }

  private equality(): Expr {
    let expr = this.comparision();

    while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      let operator = this.previous();
      let right = this.comparision();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private comparision(): Expr {
    let expr = this.term();

    while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      let operator = this.previous();
      let right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while(this.match(TokenType.MINUS, TokenType.PLUS)) {
      let operator = this.previous();
      let right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    if(this.match(TokenType.SLASH, TokenType.STAR)) {
      let operator = this.previous();
      let right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if(this.match(TokenType.BANG, TokenType.MINUS)) {
      let operator = this.previous();
      let right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr {
    if(this.match(TokenType.FALSE)) return new Literal(false);

    if(this.match(TokenType.TRUE)) return new Literal(true);

    if(this.match(TokenType.NIL)) return new Literal(null);

    if(this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if(this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    if(this.match(TokenType.LEFT_PAREN)) {
      let expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expected expression.");
    
  }

  private consume(type: TokenType, message: string): Token {
    if(this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    Lox.error(token, message);
    return new ParseError();
  }

  private synchronize() {
    this.advance();

    while(!this.isAtEnd()) {
      if(this.previous().type === TokenType.SEMICOLON) return;

      switch(this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }
    }

    this.advance();
  }


  private match(...types: TokenType[]): Boolean {
    for(let type of types) {
      if(this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): Boolean {
    if(this.isAtEnd()) {
      return false;
    }

    return this.peek().type === type;
  }

  private advance(): Token {
    if(!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  private isAtEnd(): Boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

}

export default Parser;