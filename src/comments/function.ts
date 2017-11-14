import * as ts from 'typescript'
import { getName, getComments, getTags, Logger, HasJSDoc } from '../utils'

import createParamTag from './tags/paramTag'
import createReturnTag from './tags/returnTag'
import createGenericTag from './tags/genericTag'

export function createCommentForFunction(node: ts.FunctionLike & HasJSDoc): string[] {
  if (!node.name || !ts.isIdentifier(node.name)) {
    Logger.warn('Non identifier for function name. Not sure how to handle. Skipping.')
    return []
  }

  const lines: string[] = [
    ...getComments(node),
    '@function',
    `@name ${getName(node.name)}`
  ]

  for (let tag of getTags(node)) {
    switch (tag.tagName.text) {
      // These are handled last
      case 'param':
      case 'return':
        break
      default:
        lines.push(createGenericTag(tag))
        break
    }
  }

  node.parameters.forEach((param, index) => {
    const name = ts.isIdentifier(param.name) ? param.name.text : `param${index + 1}`
    const tag = getTags(node).find(tag => tag.name && ts.isIdentifier(tag.name) && tag.name.text === name)
    lines.push(...createParamTag(name, param, tag))
  })

  lines.push(createReturnTag(node, getTags(node).find(tag => tag.tagName.text === 'return')))

  return lines
}
