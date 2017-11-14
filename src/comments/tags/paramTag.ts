import * as ts from 'typescript'
import { getType, printNode } from '../../utils'

function isOptional(param: ts.ParameterDeclaration | ts.PropertySignature): boolean {
  return !!param.questionToken ||
    !!param.initializer
}

function getDefault(param: ts.ParameterDeclaration | ts.PropertySignature | ts.BindingElement): string {
  if (!param.initializer) return ''

  if (ts.isIdentifier(param.initializer) ||
    ts.isStringLiteral(param.initializer) ||
    ts.isNumericLiteral(param.initializer)
  ) {
    return param.initializer.text
  } else if (ts.isObjectLiteralExpression(param.initializer)) {
    return printNode(param.initializer)
  }

  return '?'
}

function getParamType(param: ts.ParameterDeclaration, tag?: ts.JSDocPropertyLikeTag): string {
  const tagType = tag && tag.typeExpression ? getType(tag.typeExpression.type) : '?'
  const paramType = param.type ? getType(param.type) : '?'

  if (tagType == '?') return paramType
  else if (paramType == '?') return tagType
  else if (paramType == tagType) return paramType

  throw new Error('Mismatching types!')
}

function getTagComment(tag?: ts.JSDocPropertyLikeTag): string {
  return tag && tag.comment ? `- ${tag.comment}` : ''
}

// TypeNodes can have members when destructuring
type TypeNodeWithMembers = ts.TypeNode & { members: ts.PropertySignature[] }

function hasMembers(node: ts.TypeNode): node is TypeNodeWithMembers {
  return !!(node as any).members
}

function hasElements<T extends ts.Node>(node?: T): node is T & { elements: ts.NodeArray<ts.BindingElement>} {
  return !!node && !!(node as any).elements
}

function getBindingElement([...path]: string[], root: ts.BindingElement[]): ts.BindingElement | undefined {
  const id = path.shift()
  const result = root.find(({ name, propertyName }) => {
    if (propertyName) return ts.isIdentifier(propertyName) && propertyName.text === id
    return ts.isIdentifier(name) && name.text === id
  })
  if (!path.length) return result
  if (result && hasElements(result.name)) {
    return getBindingElement(path, Array.from(result.name.elements))
  }
}

function getParamsForDestructuring(name: string, param: ts.ParameterDeclaration): string[] {
  if (ts.isIdentifier(param.name) || !param.type || !hasMembers(param.type)) return []

  const lines: string[] = []

  if (isOptional(param)) {
    const def = getDefault(param)
    lines.push(`@param {Object} ${def ? `[${name} = ${def}]` : `[${name}]`}`)
  } else {
    lines.push(`@param {Object} ${name}`)
  }

  const members = param.type.members.slice()
  const names = param.name.elements.slice()
    .filter(ts.isBindingElement)
  const path = [name]

  members.forEach(function documentMember(member) {
    if (!ts.isIdentifier(member.name)) throw new Error('Not an identifer')

    const name = member.name.text


    const nameElement = getBindingElement(path.slice(1).concat(name), names)

    if (!nameElement) return

    path.push(name)

    let docName = path.join('.')
    if (isOptional(member) || nameElement.initializer) {
      const def = getDefault(nameElement)
      docName = def ? `[${docName} = ${def}]` : `[${docName}]`
    }

    if (!member.type) {
      // Type is not properly documented
      lines.push(`@param {?} ${docName}`)
    } else if (hasMembers(member.type)) {
      lines.push(`@param {Object} ${docName}`)
      member.type.members.forEach(documentMember)
    } else {
      lines.push(`@param {${getType(member.type)}} ${docName}`)
    }

    path.pop()
  })

  return lines
}

export function createParamTag(name: string, param: ts.ParameterDeclaration, tag?: ts.JSDocPropertyLikeTag): string[] {

  const lines: string[] = []

  if (ts.isIdentifier(param.name)) {
    // Single argument
    if (isOptional(param)) {
      const def = getDefault(param)
      name = def ? `[${name} = ${def}]` : `[${name}]`
    }

    lines.push(`@param {${getParamType(param, tag)}} ${name} ${getTagComment(tag)}`)
  } else {
    // Destructuring
    lines.push(...getParamsForDestructuring(name, param))
  }

  return lines
}
