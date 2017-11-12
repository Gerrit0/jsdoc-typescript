import * as ts from 'typescript'
import { SyntaxKind, TypeNode, TypeElement } from 'typescript'

/**
* The JSDoc logger provided for extensions
* @see http://usejsdoc.org/about-plugins.html#reporting-errors
*/
export const Logger = require('jsdoc/util/logger') as {
  warn(message: string): void,
  error(message: string): void,
  fatal(message: string): void,
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
  [SyntaxKind.VoidKeyword, 'void'],
  [SyntaxKind.AnyKeyword, '*'],
  [SyntaxKind.NumberKeyword, 'number'],
  [SyntaxKind.StringKeyword, 'string'],
  [SyntaxKind.FunctionDeclaration, 'function'],
]);

export function getTypeFromSyntaxKind(node: TypeNode | TypeElement | undefined): string {
  if (!node) return '?'

  if (ts.isTypeReferenceNode(node)) {
    return `${getName(node.typeName)}`
  }

  return typeMap.get(node.kind) || '?'
}

export function createDocComment(lines: string[]): string {
  return '/**\n * ' + lines.join('\n * ') + '\n */'
}

export function getTags(node: HasJSDoc): ts.JSDocPropertyLikeTag[] {
  return flatten(pluckExisting(node.jsDoc, 'tags') as ts.NodeArray<ts.JSDocPropertyLikeTag>[])
}

export function getComments(node: HasJSDoc): string[] {
  return pluckExisting(node.jsDoc, 'comment') as string[]
}
