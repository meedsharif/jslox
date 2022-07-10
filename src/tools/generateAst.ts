
import fs from 'fs';
import path from 'path';

const mapTypes: Record<string, string> = {
  Token: `Token`,
  Expr: `Expr`,
  Stmt: `Stmt`,
  'List<Expr>': `Expr[]`,
  Object: 'any',
}

function defineAst (outputDir: string, baseName: string, types: Record<string, string>) {
  const indent = '  ';
  const outputPath = path.resolve(__dirname, "..", "..", 
  "src", outputDir, baseName + '.ts')
  const writer = fs.createWriteStream(outputPath)

  writer.write(`/* generated by ${path.basename(__filename)} */\n\n`)
  writer.write(`import { Token } from './token';\n`)
  writer.write(`class ${baseName} {\n`)
  writer.write(`${indent}accept (visitor: any) {}\n`)
  writer.write(`}\n\n`)

  const classNames = Object.keys(types)
  classNames.forEach(className => {
    defineType(writer, baseName, className, types[className])
    writer.write('\n')
  })

  const allExports = classNames.map(className =>
    `${indent}${className}`
  ).join(`,\n`)

  writer.write(`export {\n`)
  writer.write(allExports.concat(`,\n${indent}Expr`))
  writer.write('\n}\n')

  writer.end()
}

function defineType (writer: fs.WriteStream, baseName: string, className: string, fieldList: string) {
  const indent = '  ';
  writer.write(`class ${className} extends ${baseName} {\n`)

  const fields = fieldList.split(', ')
  const fieldNames = fields.map(field =>
    {
      const [type, arg] = field.split(' ');
      return arg;
    }
  )

  const fieldWithTypes = fields.map(field =>
    {
      const [type, arg] = field.split(' ');
      return `${arg}: ${mapTypes[type]}`
    }
  )

  fieldWithTypes.forEach(field => {
    writer.write(`${indent}public ${field};\n`)
  })

  writer.write(`${indent}constructor (${fieldWithTypes.join(', ')}) {\n`)
  writer.write(`${indent}${indent}super()\n`)

  fieldNames.forEach(fieldName => {
    writer.write(`${indent}${indent}this.${fieldName} = ${fieldName};\n`)
  })
  writer.write(`${indent}}\n\n`)

  writer.write(`${indent}accept (visitor: any) {\n`)
  writer.write(`${indent}${indent}return visitor.visit${className}${baseName}(this)\n`)
  writer.write(`${indent}}\n`)

  writer.write(`}\n`)
}

async function main() {
  // const args = process.argv.slice(2);
  // if (args.length !== 1) {
  //   console.log("Usage: node generateAst.js <path/to/output/dir>");
  //   process.exit(64);
  // }

  const outputDir = "lox";

  defineAst(outputDir, 'Expr', {
    Assign: 'Token name, Expr value',
    Binary: 'Expr left, Token operator, Expr right',
    Call: 'Expr callee, Token paren, List<Expr> args',
    Grouping: 'Expr expression',
    Literal: 'Object value',
    Logical: 'Expr left, Token operator, Expr right',
    Unary: 'Token operator, Expr right',
    Variable: 'Token name'
  })
}

main();