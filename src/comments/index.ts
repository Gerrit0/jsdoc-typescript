import * as ts from 'typescript'
import { hasJSDoc, pluck, Logger } from '../utils';

import getCommentForFunction from './function'
import getCommentForInterface from './interface'
import createCommentForModule from './module'


export default function getComments(source: ts.SourceFile): string[] {
  const comments: string[] = []
  const printer = ts.createPrinter()

  let namespace: string[] = []

  const documentNode = (node: ts.Node) => {
    // console.log(ts.SyntaxKind[node.kind], hasJSDoc(node) ? '- Has JSDoc' : '')

    // If this is a module block, recurse to get exported items.
    if (ts.isModuleDeclaration(node)) {
      namespace.push(node.name.text)
      node.forEachChild(documentNode)
      namespace.pop()
    } else if (ts.isModuleBlock(node)) {
      node.forEachChild(documentNode)
    }

    // Only process exported nodes
    if (!node.modifiers || pluck(node.modifiers, 'kind').indexOf(ts.SyntaxKind.ExportKeyword) == -1) {
      return
    }

    // Require at least an empty comment, otherwise skip
    if (!hasJSDoc(node)) return

    try {
      if (ts.isFunctionLike(node)) {
        const comment = getCommentForFunction(node, namespace)
        if (comment) comments.push(comment)
      } else if (ts.isModuleDeclaration(node)) {
        const comment = createCommentForModule(node, namespace)
        if (comment) comments.push(comment)
      } else if (ts.isInterfaceDeclaration(node)) {
        const comment = getCommentForInterface(node, namespace)
        if (comment) comments.push(comment)
      } else {
        Logger.warn(`Documenting ${ts.SyntaxKind[node.kind]} is not yet supported.`)
      }
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