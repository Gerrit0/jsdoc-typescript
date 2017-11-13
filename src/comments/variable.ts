import * as ts from 'typescript'
import { HasJSDoc, getComments, getTags } from '../utils'

import createGenericTag from './tags/genericTag'

type Declaration = HasJSDoc & ts.VariableDeclaration

export function createCommentForVariable(node: Declaration): string[] {
  const lines: string[] = [
    ...getComments(node),
  ]

  console.log(node)

  for (let tag of getTags(node)) {
    lines.push(createGenericTag(tag))
  }

  return lines
}
