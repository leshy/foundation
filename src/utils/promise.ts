import * as types from '../types'

export type HashFunction = (...args: Array<types.Jsonable>) => string

export const hashJson: HashFunction = (...args: Array<types.Jsonable>) =>
  JSON.stringify(args)

// type Mapper = <T>(T, number) => any
type MaybePromise<T> = Promise<T> | T

export const isPromise = (something: any): something is Promise<any> =>
  something && something.then && something.then.constructor === Function

export const ensurePromise = <T>(maybePromise: MaybePromise<T>): Promise<T> =>
  isPromise(maybePromise) ? maybePromise : Promise.resolve(maybePromise)

export const series = async function <T>(
  array: Array<MaybePromise<T>>
): Promise<Array<T>> {
  const result: Array<T> = []
  for (let val of array) {
    result.push(isPromise(val) ? await val : val)
  }
  return result
}

export const flow = (...array: Array<Function>) => async (result: any) => {
  for (let val of array) {
    result = val(result)
    result = isPromise(result) ? await result : result
  }
  return result
}

export const maybePromiseResolve = async <T>(
  val: types.MaybePromise<T>
): Promise<T> => (isPromise(val) ? await val : val)

export type ResolvableProps<T> = object &
  { [K in keyof T]: types.MaybePromise<T[K]> }

export const propsResolveSeries = async function <T>(
  dict: ResolvableProps<T>
): Promise<T> {
  const result: Promise<T> = {} as any
  for (let key of Object.keys(dict)) {
    // @ts-ignore
    result[key] = await maybePromiseResolve(dict[key])
  }
  return result
}

export const propsResolve = propsResolveSeries // todo parallel

export const cache = <ARGS extends Array<any>, RET extends types.Jsonable>(
  store: types.KVStore<any>,
  hash: HashFunction = hashJson
) => (f: (...args: ARGS) => Promise<RET>) => (...args: ARGS) =>
  new Promise((resolve, reject) => {
    const argHash = hash(args)
    store.get(argHash).then(ret => {
      if (ret) {
        resolve(ret)
      } else {
        f(...args)
          .then(ret => store.set(argHash, ret))
          .then(resolve)
          .catch(reject)
      }
    })
  })

// export const depthFirstMap = async (dict, mapper) => {
//   const result = {}
//   for (let key of Object.keys(dict)) {
//     const val = dict[key]
//     result[key] = isDict(val)
//       ? await depthFirstMap(val, mapper)
//       : await mapper(val)
//   }
//   return result
// }

// export const each = async function(mapper, array) {
//   let res: MaybePromise<any>
//   for (const element of array) {
//     res = mapper(element)
//     if (isPromise(res)) {
//       await res
//     }
//   }
// }

// export const map = async function(mapper, array: Array<any>) {
//   let result: Array<any> = []
//   let res: MaybePromise<any>
//   for (const element of array) {
//     res = mapper(element)
//     result.push(isPromise(res) ? await res : res)
//   }
// }

export const delay = <T>(n: number, f: () => Promise<T>) => (): Promise<T> =>
  new Promise(resolve => {
    setTimeout(() => f().then(resolve), n)
  })

export const times = async <T>(
  n: number,
  f: () => Promise<T>
): Promise<Array<T>> =>
  n ? [await f(), ...(await times(n - 1, f))] : [await f()]
