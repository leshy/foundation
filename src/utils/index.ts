import * as path from 'path'

const _flow = require('lodash/flow')
const _isFunction = require('lodash/isFunction')
const mapValues = require('lodash/mapValues')
const flatten = require('lodash/flatten')
const fpReduce = require('lodash/fp/reduce')
const fpMapValues = require('lodash/fp/mapValues')
const _mergeWith = require('lodash/mergeWith')
const _set = require('lodash/set')
const clone = require('lodash/clone')
const head = require('lodash/head')
import Ajv from 'ajv'

const ajv = new Ajv({ useDefaults: true })

import * as promise from './promise'
import * as set from './set'

import * as types from '../types'
export { promise, set, ajv }

type Callback = (value: any, key: string) => any

export const joinPath = (...args: Array<string | Array<string>>): string =>
  path.join(head(flatten(args)))

export const fpMapValuesWithKey = fpMapValues.convert({ cap: false })

export const depthFirstMap = (callback: Callback) =>
  fpMapValuesWithKey((value: any, key: string) =>
    isDict(value) ? depthFirstMap(callback)(value, key) : callback(value, key)
  )

export function mutableDeepMergeTwo<T>(
  dict1: types.Dict<T>,
  dict2: types.Dict<T>
): types.Dict<T> {
  return _mergeWith(dict1, dict2, (dst: T, src: T) => {
    if (dst === undefined) {
      return src
    } else if (isDict(dst) && isDict(src)) {
      return deepMerge(dst, src)
    } else {
      return src
    }
  })
}

export function mutableDeepMerge<T>(
  dict: types.Dict<T>,
  ...dicts: types.Dict<T>[]
): types.Dict<T> {
  return fpReduce(mutableDeepMergeTwo, dict)(dicts)
}

export function deepMerge(...dicts: types.Dict<any>[]) {
  const accumulator = {}
  return fpReduce(mutableDeepMergeTwo, accumulator)(dicts)
}

// functional mutable push (mutable for speed)
export const push = <T>(array: Array<T>) => (value: T): Array<T> => {
  array.push(value)
  return array
}

// could have composed map and filter but didn't like building intermediate data structures between them
export const mapFilter = <IN, OUT>(callback: (item: IN) => OUT) => {
  const accumulator: Array<OUT> = []
  return fpReduce((results: Array<OUT> = [], item: IN) => {
    const result = callback(item)
    return result === undefined ? results : push(results)(result)
  }, accumulator)
}

type Transformer = (value: any, key: string) => any
export const transform = <T extends { [key: string]: any }>(attr: string) => (
  transformer: Transformer
) => (obj: T): T => _set({ ...obj }, attr, transformer(obj[attr], attr))

// https://www.typescriptlang.org/docs/handbook/mixins.html
export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        // @ts-ignore
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
      )
    })
  })
}

export const propsCall = <T extends object>(
  props: types.MaybeFunctionProps<T>
) => mapValues(props, maybeFunctionCall)

export const propsExec = _flow([propsCall, promise.propsResolve])

export const maybeFunctionCall = <T>(val: types.MaybeFunction<T>): T =>
  isFunction(val) ? val() : val

export const exec: <T>(val: types.MaybeAsync<T>) => Promise<T> = _flow([
  maybeFunctionCall,
  promise.maybePromiseResolve
])

// for type guards

export const isString = (x: any): x is string => typeof x === 'string'

export const isNumber = (x: any): x is number => typeof x === 'number'

export const isFunction = (something?: any): something is Function =>
  _isFunction(something)

export function isArray(v: any): v is Array<any> {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v instanceof Array)
  )
}

export function isDict(v: any): v is types.Dict<any> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !(v instanceof Array) &&
    !(v instanceof Date) &&
    !(v instanceof Promise)
  )
}

export function notExists(value: any) {
  return value === undefined || value === null
}

export function exists(value: any) {
  return value !== undefined && value !== null
}

// wow this is difficult to but simple.
// its a function wrapper that applies defaults to arguments
//
// unit test looks like this:
//
//     const wrapped = utils.args({ a: 1, b: 2 })(opts =>
//      expect(opts).toEqual({ a: 1, b: 3 })
//    )
//    wrapped({ b: 3 })
//
export const args = <IN extends types.Dict<any>, OUT>(defaultArguments: IN) => (
  targetFunction: (opts: IN) => OUT
): ((opts: Partial<IN>) => OUT) => (args: Partial<IN>) =>
    targetFunction(deepMerge(defaultArguments, args))

// same as the above, just using a JSON validator
export class ArgumentValidationError extends Error { }
export const argsSchema = <IN, OUT>(schema: object) => {
  type TargetFunction = (args: IN) => OUT
  const compiledSchema = ajv.compile(schema)

  return (targetFunction: TargetFunction) => (args: Partial<IN>): OUT => {
    const argsClone = clone(args)

    if (!compiledSchema(argsClone)) {
      const error = head(compiledSchema.errors)
      throw new ArgumentValidationError(`${error.dataPath} ${error.message}`)
    }
    return targetFunction(argsClone as IN)
  }
}
