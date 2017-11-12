import * as ts from 'typescript'
import { getType, printNode } from '../../utils'


export default function createParamTag(name: string, param: ts.ParameterDeclaration, tag?: ts.JSDocPropertyLikeTag): string {

  if ((tag && tag.isBracketed) || param.questionToken || param.initializer) {
    let def = ''

    // The initializer can be almost anything...
    // Todo: Functions, Object Literals, Object References
    if (param.initializer) {
      if (ts.isIdentifier(param.initializer) ||
        ts.isStringLiteral(param.initializer) ||
        ts.isNumericLiteral(param.initializer)
      ) {
        def = param.initializer.text
      } else if (ts.isObjectLiteralExpression(param.initializer)) {
        def = printNode(param.initializer)
      } else {
        def = '?'
      }
    }

    name = def ? `[${name} = ${def}]` : `[${name}]`
  }

  let type = '?'
  const tagType = tag && tag.typeExpression ? getType(tag.typeExpression.type) : '?'
  const paramType = param.type ? getType(param.type) : '?'

  if (tagType == '?') type = paramType
  else if (paramType == '?') type = tagType
  else {
    if (paramType == tagType) type = paramType
    else throw new Error('Mismatching types!')
  }

  return `@param {${type}} ${name}${tag && tag.comment ? ' - ' + tag.comment : ''}`
}
