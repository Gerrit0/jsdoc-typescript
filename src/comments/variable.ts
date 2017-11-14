import * as ts from 'typescript'
import { HasJSDoc, getComments, getTags } from '../utils'

import { createGenericTag } from './tags/genericTag'

export function createCommentForVariable(node: ts.VariableDeclaration & HasJSDoc): string[] {
  const lines: string[] = [
    ...getComments(node),
  ]

  console.log(node)

  for (let tag of getTags(node)) {
    lines.push(createGenericTag(tag))
  }

  return lines
}
