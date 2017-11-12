import * as ts from 'typescript'
import { getComments, HasJSDoc, createDocComment, getTags, hasJSDoc, Logger, getTypeFromSyntaxKind } from '../utils'
import createGenericTag from './tags/genericTag';

export default function createCommentFromInterface(node: ts.InterfaceDeclaration & HasJSDoc, namespace: string[]): string {
  const lines: string[] = [
    ...getComments(node),
    ...getTags(node).map(createGenericTag)
  ]
  lines.push(`@typedef {Object} ${node.name.text}`)

  if (namespace.length) lines.push(`@memberof ${namespace.join('.')}`)

  for (const member of node.members) {
    if (!hasJSDoc(member)) {
      Logger.warn(`Member of ${node.name.text} is missing documentation.`)
      continue
    }

    if (!member.name || !ts.isIdentifier(member.name)) {
      Logger.warn('Unknown type of member identifier')
      continue
    }

    let name = member.name.text

    if (!ts.isPropertySignature(member)) {
      Logger.warn('Unknown type of member, expected PropertySignature but got' + ts.SyntaxKind[member.kind])
      continue
    }

    const type = getTypeFromSyntaxKind(member.type)
    const comment = getComments(member).join(' ')

    if (member.questionToken) {
      name = `[${name}]`
    }

    lines.push(`@property {${type}} ${name} - ${comment}`)
  }

  return createDocComment(lines)
}