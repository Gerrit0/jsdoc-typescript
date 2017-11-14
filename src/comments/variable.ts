import * as ts from 'typescript'
import { HasJSDoc, getComments, getTags, getType, getTypeFromKind } from '../utils'

import { createGenericTag } from './tags/genericTag'
import { createCommentForFunction } from './function'

function hasInitializer(prop: ts.ObjectLiteralElement): prop is ts.ObjectLiteralElement & { initializer: ts.Node } {
  return !!(prop as any).initializer
}

function getTypeFromObjectLiteral(props: ts.NodeArray<ts.ObjectLiteralElement>): string {
  const propsArr = props
    .filter(hasInitializer)
    .map(({ name, initializer }) => {
      const property = name && ts.isIdentifier(name) ? name.text : 'unknown'
      const kind = initializer ? initializer.kind : ts.SyntaxKind.Unknown
      return { property, kind }
    })
    .map(({ property, kind }) => `${property}: ${getTypeFromKind(kind)}`)

  return `{ ${propsArr.join(', ')} }`
}

export function createCommentForVariable(node: ts.VariableDeclaration & HasJSDoc & { declarationList: ts.VariableDeclarationList }): string[] {
  const lines: string[] = [
    ...getComments(node),
    ...getTags(node).map(createGenericTag),
  ]

  const [ variable ] = node.declarationList.declarations

  // If the name isn't an identifier, not sure what it is, just return
  if (!ts.isIdentifier(variable.name)) return lines
  const name = variable.name.text

  // No initializer, so no way to get more information
  if (!variable.initializer) return lines

  const { initializer } = variable

  if (ts.isFunctionLike(initializer)) {
    // Take the name from the variable, not the function
    lines.push(
      `@name ${name}`,
      ...createCommentForFunction(initializer)
        .filter(line => !line.startsWith('@name')),
    )
  } else {
    if (ts.isNumericLiteral(initializer)) {
      lines.push(`@member {number} ${name}`)
    } else if (ts.isStringLiteral(initializer)) {
      lines.push(`@member {string} ${name}`)
    } else if (ts.isObjectLiteralExpression(initializer)) {
      lines.push(`@member {${getTypeFromObjectLiteral(initializer.properties)}} ${name}`)
    }
  }

  return lines
}
