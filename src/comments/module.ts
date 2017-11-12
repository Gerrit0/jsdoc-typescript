import * as ts from 'typescript';
import { HasJSDoc, createDocComment, getComments, getTags } from '../utils'
import createGenericTag from './tags/genericTag';

export default function createCommentForModule(node: ts.ModuleDeclaration & HasJSDoc, namespace: string[]): string {
  const lines: string[] = [
    ...getComments(node),
    `@namespace ${node.name.text}`
  ]

  if (namespace.length) lines.push(`@memberof ${namespace.join('.')}`)

  for (let tag of getTags(node)) {
    lines.push(createGenericTag(tag))
  }

  return createDocComment(lines)
}
