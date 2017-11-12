import * as ts from 'typescript'
import { getComments, HasJSDoc, getTags, getType } from '../utils'
import createGenericTag from './tags/genericTag'
import createFunctionComment from './function'

// Literal types and type references are considered "simple"
function isSimpleType(node: ts.Node): boolean {
  return !(
    ts.isUnionTypeNode(node) ||
    ts.isIntersectionTypeNode(node) ||
    ts.isFunctionTypeNode(node)
  )
}

export default function createCommentFromType(node: ts.TypeAliasDeclaration & HasJSDoc): string[] {
  const lines: string[] = [
    ...getComments(node),
    ...getTags(node).map(createGenericTag)
  ]

  // Simple alias for literal
  if (isSimpleType(node.type)) {
    lines.push(`@typedef {${getType(node.type)}} ${node.name.text}`)
  }
  // Function - typedef takesString = (a: string) => void
  else if (ts.isFunctionTypeNode(node.type)) {
    // See http://usejsdoc.org/tags-callback.html
    lines.push(`@callback ${node.name.text}`)
    node.type.parameters.forEach(param => {
      if (!ts.isIdentifier(param.name)) {
        console.log('Unknown parameter name, no identifier', param)
        return
      }
      lines.push(`@param {${getType(param.type)}} ${param.name.text}`)
    })
  }
  // Union or intersection type, wrap in () as required by JSDoc
  else {
    lines.push(`@typedef {(${getType(node.type)})} ${node.name.text}`)
  }

  return lines
}
