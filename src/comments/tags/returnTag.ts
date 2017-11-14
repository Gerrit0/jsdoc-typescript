import * as ts from 'typescript'
import { getType, Logger } from '../../utils'

/**
* Creates an @return for the provided function
*
* @param node the function to get the return type for
* @param tag the optional @return tag to respond with
*/
export function createReturnTag(node: ts.FunctionLike, tag?: ts.JSDocPropertyLikeTag): string {
  let type = '?'
  let docType = tag && tag.typeExpression ? getType(tag.typeExpression.type) : '?'
  let codeType = getType(node.type)

  if (docType == '?') type = codeType
  else if (codeType == '?') type = docType
  else {
    if (docType != codeType) {
      Logger.warn(`Different return types for function`)
    }
    type = codeType
  }

  return `@return {${type}} ${tag && tag.comment ? `- ${tag.comment}` : ''}`
}
