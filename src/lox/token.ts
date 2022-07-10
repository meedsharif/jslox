import TokenType from "./tokenType";

interface Token {
  type: TokenType | string;
  lexeme: string;
  literal: string | number | null;
  line: number;
}

function toString(token: Token): string {
  return `${token.type} ${token.lexeme} ${token.literal}`;
}

export { Token, toString };
