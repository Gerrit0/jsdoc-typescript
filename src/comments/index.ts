import * as ts from 'typescript'
import { hasJSDoc, pluck, Logger } from '../utils'

interface TypeHandler<HandledType extends ts.Node> {
  test(node: ts.Node): node is HandledType
  handle(node: HandledType): string[]
}

const types: TypeHandler<ts.Node>[] = []

const createComment = (node: ts.Node) => {
  for (const { test, handle } of types) {
    if (test(node)) return handle(node)
  }
  Logger.warn(`Documenting ${ts.SyntaxKind[node.kind]} is not yet supported.`)
  return []
}

import createCommentForFunction from './function'
types.push( { test: ts.isFunctionLike, handle: createCommentForFunction })

import createCommentForInterface from './interface'
types.push({ test: ts.isInterfaceDeclaration, handle: createCommentForInterface })

import createCommentForModule from './module'
types.push({ test: ts.isModuleDeclaration, handle: createCommentForModule })

import createCommentForType from './type'
types.push({ test: ts.isTypeAliasDeclaration, handle: createCommentForType })


export default function getComments(source: ts.SourceFile): string[][] {
  const comments: string[][] = []
  const printer = ts.createPrinter()

  let namespace: string[] = []

  //tslint:disable-next-line:cyclomatic-complexity
  const documentNode = (node: ts.Node) => {

    // If this is a module block, recurse to get exported items.
    if (ts.isModuleDeclaration(node)) {
      namespace.push(node.name.text)
      node.forEachChild(documentNode)
      namespace.pop()
    } else if (ts.isModuleBlock(node)) {
      node.forEachChild(documentNode)
    }

    // Only process exported nodes
    if (!node.modifiers || !pluck(node.modifiers, 'kind').includes(ts.SyntaxKind.ExportKeyword)) {
      return
    }

    // Require at least an empty comment, otherwise skip
    if (!hasJSDoc(node)) return

    try {
      const comment = createComment(node)
      if (namespace.length) comment.push(`@memberof ${namespace.join('.')}`)
      comments.push(comment)
    } catch (error) {
      Logger.error(
        'Error:\n' +
        error.message +
        '\nThrown for node:\n' +
        printer.printNode(ts.EmitHint.Unspecified, node, source)
      )
    }
  }

  ts.forEachChild(source, documentNode)

  return comments
}