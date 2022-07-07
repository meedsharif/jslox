import * as jslox from "./error";
import { Token } from "./token";
import TokenType from "./tokenType";

class Scanner {
  private source: string;
  private tokens: Token[];
  private start: number;
  private current: number;
  private line: number;
  private keywords: Record<string, TokenType> = {};

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.initKeywordsMap();
  }

  private initKeywordsMap() {
    this.keywords = {
      and: TokenType.AND,
      class: TokenType.CLASS,
      else: TokenType.ELSE,
      false: TokenType.FALSE,
      for: TokenType.FOR,
      fun: TokenType.FUN,
      if: TokenType.IF,
      nil: TokenType.NIL,
      or: TokenType.OR,
      print: TokenType.PRINT,
      return: TokenType.RETURN,
      super: TokenType.SUPER,
      this: TokenType.THIS,
      true: TokenType.TRUE,
      var: TokenType.VAR,
      while: TokenType.WHILE,
    };
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType[TokenType.EOF],
      lexeme: "",
      literal: null,
      line: this.line,
    });
    return this.tokens;
  }

  public isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private scanToken() {
    let c = this.advance();

    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN, null);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN, null);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE, null);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE, null);
        break;
      case ",":
        this.addToken(TokenType.COMMA, null);
        break;
      case ".":
        this.addToken(TokenType.DOT, null);
        break;
      case "-":
        this.addToken(TokenType.MINUS, null);
        break;
      case "+":
        this.addToken(TokenType.PLUS, null);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON, null);
        break;
      case "*":
        this.addToken(TokenType.STAR, null);
        break;

      case "!":
        this.addToken(
          TokenType.BANG,
          this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG
        );
        break;
      case "=":
        this.addToken(
          TokenType.EQUAL,
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(
          TokenType.LESS,
          this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS
        );
        break;
      case ">":
        this.addToken(
          TokenType.GREATER,
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;

      case "/":
        if (this.match("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH, null);
        }
        break;

      case " ":
      case "\r":
      case "\t":
        break;

      case "\n":
        this.line++;
        break;
      case '"':
        this.string();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          jslox.error(this.line, `Unexpected character ${c}`);
        }

        break;
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = this.keywords[text] || TokenType.IDENTIFIER;
    this.addToken(type);
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      jslox.error(this.line, "Unterminated string.");
      return;
    }

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return "\0";
    }
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;

    this.current++;
    return true;
  }

  private advance(): string {
    this.current++;
    return this.source[this.current - 1];
  }

  private addToken(
    type: TokenType,
    literal: string | number | null = null
  ): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({
      type: TokenType[type],
      lexeme: text,
      literal,
      line: this.line,
    });
  }
}

export default Scanner;
