import * as ts from 'typescript'
import { getComments, HasJSDoc, getTags, hasJSDoc, Logger, getType } from '../utils'
import { createGenericTag } from './tags/genericTag'

export function createCommentForInterface(node: ts.InterfaceDeclaration & HasJSDoc): string[] {
  const lines: string[] = [
    ...getComments(node),
    ...getTags(node).map(createGenericTag)
  ]
  lines.push(`@typedef {Object} ${node.name.text}`)

  for (const member of node.members) {
    if (!member.name || !ts.isIdentifier(member.name)) {
      Logger.warn('Unknown type of member identifier')
      continue
    }

    let name = member.name.text

    if (!ts.isPropertySignature(member)) {
      Logger.warn('Unknown type of member, expected PropertySignature but got' + ts.SyntaxKind[member.kind])
      continue
    }

    const type = getType(member.type)
    const comment = hasJSDoc(member) ? getComments(member).join(' ') : ''

    if (member.questionToken) {
      name = `[${name}]`
    }

    lines.push(`@property {${type}} ${name} ${comment ? `- ${comment}` : ''}`)
  }

  return lines
}
