import { Binary, Expr, Grouping, Literal, Unary, Variable } from './expr';
import TokenType from './tokenType';

class AstPrinter {
    print(node: Expr) {
        return node.accept(this);
    }

    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: Literal): string {
        return expr.value.toString();
    }

    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    visitVariableExpr(expr: Variable): string {
        return expr.name.lexeme;
    }

    private parenthesize(name: string, ...exprs: Expr[]): string {
        let builder = "";
        builder += "(";
        builder +=  (name);
        for (let expr of exprs) {
            builder += (" ");
            builder += (this.print(expr));
        }
        builder += (")");
        return builder.toString();
    }

    constructor() {
      const expression: Expr = new Binary(
        new Unary(
          { lexeme: "-", line: 1, type: TokenType.MINUS, literal: null },
          new Literal(123)
        ),
        { lexeme: "*", line: 1, type: TokenType.STAR, literal: null },
        new Grouping(
          new Literal(45.67)
        )
      );

      console.log(this.print(expression));
    }
}

const printer = new AstPrinter();
