import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from "./expr";
import Lox from "./lox";
import { Block, Expression, Function, If, Print, Stmt, Var, While } from "./stmt";
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
    if(this.match(TokenType.FOR)) {
      return this.forStatement();
    }

    if(this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if(this.match(TokenType.PRINT)) {
      return this.printStatement();
    }

    if(this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }

    if(this.match(TokenType.LEFT_BRACE)) {
      return new Block(this.block());
    }

    return this.expressionStatement();
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for' statement.");
   
    let initializer: Stmt | void;
    if(this.match(TokenType.SEMICOLON)) {
      
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | void;
    if(!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Expr | void;
    if(!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");
    let body = this.statement();

    if(increment) {
      body = new Block([body, new Expression(increment)]);
    }

    if(!condition) {
      condition = new Literal(true);
    }

    body = new While(condition, body);

    if(initializer) {
      body = new Block([initializer, body]);
    }

    return body;
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

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while' statement.");
    let condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    let body = this.statement();

    return new While(condition, body);
  }

  private expressionStatement(): Stmt {
    let expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private func(kind: string): Function {
    let name = this.consume(TokenType.IDENTIFIER, "Expect " + kind + "name.");
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after " + kind + " name.");
    let parameters = new Array<Token>();
    if(!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if(parameters.length >= 8) {
          this.error(this.peek(), "Cannot have more than 8 parameters.");
        }
        parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
      } while(this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body.");

    let body = this.block();
    return new Function(name, parameters, body);
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
    let expr = this.or();

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

  private or(): Expr {
    let expr = this.and();

    while(this.match(TokenType.OR)) {
      let operator = this.previous();
      let right = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while(this.match(TokenType.AND)) {
      let operator = this.previous();
      let right = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private declaration(): Stmt | void {
      try {
        if(this.match(TokenType.FUN)) {
          return this.func("function");
        }

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

    return this.call();
  }

  private finishCall(calle: Expr): Expr {
    let args: Expr[] = [];

    if(!this.check(TokenType.RIGHT_PAREN)) {
      do {

        if(args.length >= 255) {
          this.error(this.peek(), "Cannot have more than 255 arguments.");
        }

        args.push(this.expression());
      } while(this.match(TokenType.COMMA))
    }

    const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

    return new Call(calle, paren, args);
  }

  private call(): Expr {
    let expr = this.primary();

    while(true) {
      if(this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
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