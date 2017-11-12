import * as ts from 'typescript'
import { getTypeFromSyntaxKind, Logger } from '../../utils'

/**
* Creates an @return for the provided function
*
* @param node the function to get the return type for
* @param tag the optional @return tag to respond with
*/
export default function createReturnTag(node: ts.FunctionLike, tag?: ts.JSDocPropertyLikeTag): string {
  let type = '?'
  let docType = tag && tag.typeExpression ? getTypeFromSyntaxKind(tag.typeExpression.type) : '?'
  let codeType = getTypeFromSyntaxKind(node.type)

  if (docType == '?') type = codeType
  else if (codeType == '?') type = docType
  else {
    if (docType != codeType) {
      Logger.warn(`Different return types for function`)
    }
    type = codeType
  }

  return `@return {${type}} ${tag ? tag.comment : ''}`
}