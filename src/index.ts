import * as ts from 'typescript'
import getComments from './comments'

export const handlers = {
  beforeParse(event: { filename: string, source: string }) {
    if (/\.tsx?$/.test(event.filename)) {
      const file = ts.createSourceFile('file.ts', event.source, ts.ScriptTarget.ESNext)
      event.source = getComments(file).join('\n\n')
    }
  },
};
