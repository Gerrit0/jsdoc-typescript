import * as ts from 'typescript'
import { getName } from '../../utils'

export default function createGenericTag(tag: ts.JSDocPropertyLikeTag): string {
  return `@${getName(tag.name)} - ${tag.comment}`
}
