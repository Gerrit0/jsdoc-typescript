import * as ts from 'typescript'
import { getName, getType } from '../../utils'

export default function createParamTag(node: ts.Node, tag: ts.JSDocPropertyLikeTag): string {
  if (!ts.isFunctionLike(node)) {
    throw new Error('@param should only be used for functions.')
  }

  let name = getName(tag.name)

  // Find the param for this tag
  const param = node.parameters.find(param => {
    if (!ts.isIdentifier(param.name)) {
      throw new Error('Must be an identifier. BindingPatterns are not yet supported.')
    }

    return param.name.text === name
  })
  if (!param) {
    throw new Error(`@param tag found without matching parameter: ${name} for ${getName(node.name as ts.Identifier)}`)
  }

  if (tag.isBracketed || param.questionToken || param.initializer) {
    let def = ''

    // The initializer can be almost anything...
    // Todo: Functions, Object Literals, Object References
    if (param.initializer) {
      if (ts.isIdentifier(param.initializer) ||
      ts.isStringLiteral(param.initializer) ||
      ts.isNumericLiteral(param.initializer)
    ) def = param.initializer.text
    else def = '?'
  }

  name = def ? `[${name} = ${def}]` : `[${name}]`
}

let type = '?'
const tagType = tag.typeExpression ? getType(tag.typeExpression.type) : '?'
const paramType = param.type ? getType(param.type) : '?'

if (tagType == '?') type = paramType
else if (paramType == '?') type = tagType
else {
  if (paramType == tagType) type = paramType
  else throw new Error('Mismatching types!')
}

return `@param {${type}} ${name} - ${tag.comment}`
}
