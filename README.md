## jsdoc-typescript

A JSDoc 3 plugin for use with Typescript projects.

This is a work in progress. Most projects will only be partially documented.

### Usage

Install the plugin

```text
npm install --save-dev jsdoc-typescript
```

Add it to your `jsdoc.json` and modify the `includePattern` to pick up Typescript files.

```json
{
    "plugins": [
        "node_modules/jsdoc-typescript"
    ],
    "source": {
        "includePattern": ".+\\.tsx?$"
    }
}
```

### Features

- Support for converting Typescript `interface` into JSDoc `@typedef` when generating documentation.
- Support for converting Typescript `namespace` into JSDoc `@namespace` and adding required `@memberof` tag to all method declarations in the namespace.
- Support for automatically adding type declarations to the minimal `@param param - description` syntax used by Typescript.
- Support for documenting `type = string | number`. This will work for basic types and for type references, but not for `type = string | () => string`.
- Support for documenting optional parameters with object types correctly.
- Support for documenting destructured parameters. (Adding comments for destructured arguments is not yet supported)

### Planned Features

- Support for documenting `class` with the `@class` tag.
- Support for documenting variable expressions.


### Limitations

- Since JSDoc does not contain support for sourcemaps, your line numbers will inevitably be very off. You can disable links to source files by adding the following to your `jsdoc.json` file.

```json
{
    "templates": {
        "default": {
            "outputSourceFiles": false
        }
    }
}
```

- When using the `@link` tag, you must provide the fully qualified name to the link or it won't work. For example:

```typescript
/**
 * Works: {@link A.B}
 * Doesn't work: {@link B}
 */
export namespace A {
    /**
     * Works: {@link A.B}
     * Doesn't work: {@link B}
     */
    export interface B {
        c: string
    }
}
```

### Implementation notes

- Exporting multiple variables in one statement (that is, `export var a = 1, b = 2` will only result in `a` being documented)

### Frequently Asked Questions

1. Documentation is missing for a function - how do I make the plugin see it?

Make sure that the function is exported **and** has a JSDoc comment. If the function isn't exported, or does not have documentation associated with it, it will not be documented.

2. This doesn't work for `Feature X` can you fix it?

I plan to keep this module up to date with Typescript to ensure that all new features are properly supported. If you find something that is broken please feel free to raise an issue or submit a pull request with tests for the feature.
