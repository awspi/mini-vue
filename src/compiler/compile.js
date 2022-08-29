import { parse } from './parse'
import { generate } from './codegen'
export const compile = (template) => {
  const ast = parse(template)
  return generate(ast)
}
