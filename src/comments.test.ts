import test, { TestContext } from 'ava'
import * as ts from 'typescript'

import { getComments } from './comments'

function assertSimilarDocs(t: TestContext, result: string[][], expected: string[][]) {
  // Surrounding whitespace doesn't matter
  result = result.sort()
    .map(comment => comment
      .map(line => line.trim())
    )
  expected = expected.sort()
    .map(comment => comment
      .map(line => line.trim())
    )

  t.deepEqual(result, expected)
}

function toComments(source: string): string[][] {
  return getComments(ts.createSourceFile('file.ts', source, ts.ScriptTarget.ESNext))
}

test(`@return with description`, t => {
  const comments = toComments(`
    /**
     * case1
     * @return some number
     */
    export function case1(): number {
      return 1
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'case1',
      '@function',
      '@name case1',
      '@return {number} - some number',
    ],
  ])
})

test(`@param with optional param`, t => {
  const comments = toComments(`
    /**
     * case2
     * @param a a number
     * @param b an optional number
     */
    export function case2(a: number, b?: number): number {
      return a + (b ? b : a)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'case2',
      '@function',
      '@name case2',
      '@param {number} a - a number',
      '@param {number} [b] - an optional number',
      '@return {number}'
    ],
  ])
})

test(`@param with default value`, t => {
  const comments = toComments(`
    /**
     *
     * @param a docs
     * @param b more docs
     */
    export function case3(a: number, b: number = a): number {
      return a + b
    }
  `)


  assertSimilarDocs(t, comments, [
    [
      '@function',
      '@name case3',
      '@param {number} a - docs',
      '@param {number} [b = a] - more docs',
      '@return {number}'
    ]
  ])
})

test(`@namespace is parsed correctly`, t => {
  const comments = toComments(`
    /**
     * Namespace A
     */
    export namespace A {

    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'Namespace A',
      '@namespace A',
    ]
  ])
})

test(`@namespace results in @memberof tags`, t => {
  const comments = toComments(`
    /**
     * Namespace A
     */
    export namespace A {
      /**
       * Namespace B
       */
      export namespace B {
        /**
         * A function two deep
         */
        export function c(): number { return 1 }
      }

      /**
       * A function one deep
       */
      export function d(): number { return 2 }
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'Namespace A',
      '@namespace A',
    ],
    [
      'Namespace B',
      '@namespace B',
      '@memberof A',
    ],
    [
      'A function two deep',
      '@function',
      '@name c',
      '@return {number}',
      '@memberof A.B',
    ],
    [
      'A function one deep',
      '@function',
      '@name d',
      '@return {number}',
      '@memberof A',
    ]
  ])
})

test(`@typedef for interface`, t => {
  const comments = toComments(`
    /**
     * A interface
     */
    export interface A {
      /**
       * Some property description
       */
      prop: string
      /**
       * Some other prop
       */
      c: B
    }
    /**
     * B interface
     */
    export interface B {
      /**
       * Something
       */
      c: string
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A interface',
      '@typedef {Object} A',
      '@property {string} prop - Some property description',
      '@property {B} c - Some other prop',
    ],
    [
      'B interface',
      '@typedef {Object} B',
      '@property {string} c - Something'
    ]
  ])
})

test(`@typedef for type union declarations`, t => {
  const comments = toComments(`
    /**
     * A simple or type
     */
    export type C = string | number
    /**
     * A complex or type
     */
    export type D = C | object
  `)

  assertSimilarDocs(t, comments, [
    [
      'A simple or type',
      '@typedef {(string | number)} C'
    ],
    [
      'A complex or type',
      '@typedef {(C | object)} D'
    ]
  ])
})

test(`@typedef for type intersection declarations`, t => {
  const comments = toComments(`
    /**
     * Interface
     */
    export interface A {
      a: string
    }
    /**
     * Interface 2
     */
    export interface B {
      b: string
    }
    /**
     * A simple intersection type
     */
    export type C = A & B
  `)

  assertSimilarDocs(t, comments, [
    [
      'A simple intersection type',
      '@typedef {(A & B)} C'
    ],
    [
      'Interface',
      '@typedef {Object} A',
      '@property {string} a'
    ],
    [
      'Interface 2',
      '@typedef {Object} B',
      '@property {string} b'
    ],
  ])
})

test(`@typedef for object literal types`, t => {
  const comments = toComments(`
    /**
     * A type object literal
     */
    export type A = { a: string }
    /**
     * An optional object literal
     */
    export type B = { b?: A, c: string }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A type object literal',
      '@typedef {{ a: string }} A',
    ],
    [
      'An optional object literal',
      '@typedef {{ b: ?A, c: string }} B',
    ]
  ])
})

test(`@callback for function types`, t => {
  const comments = toComments(`
    /**
     * A function accepting a string
     */
    export type strFunc = (a: string) => void
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function accepting a string',
      '@callback strFunc',
      '@param {string} a'
    ]
  ])
})

test(`Complex function parameter types`, t => {
  const comments = toComments(`
    /**
     * A function with a default object
     * @param obj
     */
    export function case1(obj: { a: string} = { a: 'hi' }): void {
      console.log(obj.a)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function with a default object',
      '@function',
      '@name case1',
      '@param {{ a: string }} [obj = { a: "hi" }]',
      '@return {void}'
    ]
  ])
})

test(`Destructuring parameters`, t => {
  const comments = toComments(`
    /**
     * A function
     */
    export function test({ a }: { a: string }): void {
      console.log(a)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function',
      '@function',
      '@name test',
      '@param {Object} param1',
      '@param {string} param1.a',
      '@return {void}'
    ]
  ])
})

test(`Destructuring with defaults`, t => {
  const comments = toComments(`
    /**
     * A function
     * @return {void}
     */
    export function test({ a }?: { a: number} = { a: 1 }) {
      console.log(a)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function',
      '@function',
      '@name test',
      '@param {Object} [param1 = { a: 1 }]',
      '@param {number} param1.a',
      '@return {void}'
    ]
  ])
})

test(`Destructuring with defaults 2`, t => {
  const comments = toComments(`
    /**
     * A function
     * @return {void}
     */
    export function test({ a = 1, b: { c = 3 } = {} } : { a?: number, b?: { c: number } } = {}) {
      console.log(a, c)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function',
      '@function',
      '@name test',
      '@param {Object} [param1 = {}]',
      '@param {number} [param1.a = 1]',
      '@param {Object} [param1.b = {}]',
      '@param {number} [param1.b.c = 3]',
      '@return {void}'
    ]
  ])
})

test(`Array parameters`, t => {
  const comments = toComments(`
    /**
     * A function
     */
    export function test(a: string[]): void {
      console.log(...a)
    }
  `)

  assertSimilarDocs(t, comments, [
    [
      'A function',
      '@function',
      '@name test',
      '@param {Array.<string>} a',
      '@return {void}'
    ]
  ])
})

test(`Exported variables`, t => {
  const comments = toComments(`
    /**
     * An exported number
     */
    export const n = 1
    /**
     * An exported string
     */
    export let s = 'hi'
    /**
     * An exported object
     */
    export const o = { a: 1 }
    /**
     * An exported function variable
     */
    export const f = (): void => { console.log('Run') }
  `)

  assertSimilarDocs(t, comments, [
    [
      'An exported number',
      '@member {number} n'
    ],
    [
      'An exported string',
      '@member {string} s'
    ],
    [
      'An exported object',
      '@member {{ a: number }} o'
    ],
    [
      'An exported function variable',
      '@name f',
      '@function',
      '@return {void}'
    ]
  ])
})

test(`Multiple exported variables using commas`, t => {
  const comments = toComments(`
    /**
     * An exported number
     */
    export const n = 1, n2 = 2
  `)

  assertSimilarDocs(t, comments, [
    [
      'An exported number',
      '@member {number} n'
    ],
  ])
})
