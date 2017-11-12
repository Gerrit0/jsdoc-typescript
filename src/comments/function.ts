import * as ts from 'typescript'
import { hasJSDoc, getName, getComments, getTags, Logger } from '../utils'

import createParamTag from './tags/paramTag'
import createReturnTag from './tags/returnTag'
import createGenericTag from './tags/genericTag'

// TODO: If a param is not documented with @param it will be lost.

export default function getCommentForFunction(node: ts.FunctionLike): string[] {
  if (!hasJSDoc(node)) return []

  if (!node.name || !ts.isIdentifier(node.name)) {
    Logger.warn('Non identifier for function name. Not sure how to handle. Skipping.')
    return []
  }

  const lines: string[] = [
    ...getComments(node),
    '@function',
    `@name ${getName(node.name)}`
  ]

  let hasReturn = false

  for (let tag of getTags(node)) {
    switch (tag.tagName.text) {
      case 'param':
      lines.push(createParamTag(node, tag))
        break
      case 'return':
      hasReturn = true
      lines.push(createReturnTag(node, tag))
        break
      default:
      lines.push(createGenericTag(tag))
        break
    }
  }

  if (!hasReturn) lines.push(createReturnTag(node))

  return lines
}
