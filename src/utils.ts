import * as ts from 'typescript'
import { SyntaxKind, TypeNode, TypeElement } from 'typescript'

interface iLogger {
  warn(message: string): void
  error(message: string): void
  fatal(message: string): void
}

/**
* The JSDoc logger provided for extensions
* @see http://usejsdoc.org/about-plugins.html#reporting-errors
*/
let jsDocLogger: iLogger
try {
  jsDocLogger = require('jsdoc/util/logger')
} catch {}

export const Logger = {
  warn(message: string) {
    if (jsDocLogger) jsDocLogger.warn(message)
    else console.warn(message)
  },
  error(message: string) {
    if (jsDocLogger) jsDocLogger.error(message)
    else console.error(message)
  },
  fatal(message: string) {
    if (jsDocLogger) jsDocLogger.fatal(message)
    else console.error('Fatal', message)
  }
}

/**
* Plucks an item from an array of objects with the item
*/
export const pluck = <T, K extends keyof T>(arr: ArrayLike<T>, key: K) => Array.from(arr).map(v => v[key])

/**
* Plucks the specified key and ensures that all values are truthy.
*/
export const pluckExisting = <T, K extends keyof T>(arr: ArrayLike<T>, key: K) => pluck(arr, key).filter(Boolean)

/**
* Flattens an array
*
* @param arr the array to flatten
*/
export function flatten<T>(arr: ArrayLike<T>[]): T[] {
  return arr.reduce<T[]>((carry, item) => carry.concat(Array.from(item)), [])
}

/**
* Returns the fully qualified name of an entity.
*
* @param name the entity name to fully resolve
*/
export function getName(name: ts.EntityName): string {
  return ts.isIdentifier(name) ? name.text : `${getName(name.left)}.${name.right.text}`
}

/**
* All ts.Node objects that we are interested meet this interface.
*/
export interface HasJSDoc {
  jsDoc: ts.JSDoc[]
}

/**
* Checks if a node meets the interface requirements for HasJSDoc
*
* @param node the node to check
*/
export function hasJSDoc<T extends ts.Node>(node: T): node is HasJSDoc & T {
  return Array.isArray((node as any).jsDoc)
}

const typeMap = new Map<SyntaxKind, string>([
  [SyntaxKind.Unknown, '?'],
  [SyntaxKind.NumericLiteral, 'number'],
  [SyntaxKind.StringLiteral, 'string'],
  [SyntaxKind.NullKeyword, 'null'],
  [SyntaxKind.VoidKeyword, 'void'],
  [SyntaxKind.AnyKeyword, '*'],
  [SyntaxKind.NeverKeyword, 'never'],
  [SyntaxKind.ObjectKeyword, 'object'],
  [SyntaxKind.NumberKeyword, 'number'],
  [SyntaxKind.StringKeyword, 'string'],
  [SyntaxKind.UndefinedKeyword, 'undefined'],
  [SyntaxKind.FunctionDeclaration, 'function'],
])

export function getTypeFromKind(kind: ts.SyntaxKind): string {
  return typeMap.get(kind) || '?'
}

export function getType(node: TypeNode | TypeElement | undefined): string {
  if (!node || !node.kind) return '?'

  const primitiveType = typeMap.get(node.kind)
  if (primitiveType) return primitiveType

  if (ts.isArrayTypeNode(node)) return `Array.<${getType(node.elementType)}>`

  if (ts.isTypeReferenceNode(node)) return `${getName(node.typeName)}`

  if (ts.isUnionTypeNode(node)) return node.types.map(getType).join(' | ')

  if (ts.isIntersectionTypeNode(node)) return node.types.map(getType).join(' & ')

  if (ts.isTypeLiteralNode(node)) {
    return `{ ${node.members.map(getType).join(', ')} }`
  }

  if (ts.isPropertySignature(node)) {
    // Within TypeLiteral
    if (!ts.isIdentifier(node.name)) return '?'
    return `${node.name.text}: ${node.questionToken ? '?' : ''}${getType(node.type)}`
  }

  console.log('Unknown type', ts.SyntaxKind[node.kind], node)
  return '?'
}

export function printNode(node: ts.Node) {
  const file = ts.createSourceFile('file.ts', '', ts.ScriptTarget.ESNext)
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.Unspecified, node, file)
}

export function createDocComment(lines: string[]): string {
  return '/**\n * ' + lines.join('\n * ') + '\n */'
}

export function getTags(node: ts.Node): ts.JSDocPropertyLikeTag[] {
  if (!hasJSDoc(node)) return []

  return flatten(pluckExisting(node.jsDoc, 'tags') as ts.NodeArray<ts.JSDocPropertyLikeTag>[])
}

export function getComments(node: ts.Node): string[] {
  if (!hasJSDoc(node)) return []

  return pluckExisting(node.jsDoc, 'comment') as string[]
}
