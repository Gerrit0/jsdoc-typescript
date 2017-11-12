import * as ts from 'typescript'
import { HasJSDoc, getComments, getTags } from '../utils'
import createGenericTag from './tags/genericTag'

export default function createCommentForModule(node: ts.ModuleDeclaration & HasJSDoc): string[] {
  const lines: string[] = [
    ...getComments(node),
    `@namespace ${node.name.text}`
  ]

  for (let tag of getTags(node)) {
    lines.push(createGenericTag(tag))
  }

  return lines
}
