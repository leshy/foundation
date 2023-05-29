export type Class<INSTANCE> = { new(...args: any[]): INSTANCE }

export type Maybe<T> = void | T
export type MaybePromise<T> = T | Promise<T>
export type MaybeFunction<T> = (() => T) | T
export type MaybeAsync<T> = MaybeFunction<MaybePromise<T>>


// dictionary with potential functions as values
export type MaybeFunctionProps<T> = object &
  { [K in keyof T]: MaybeFunction<T[K]> }

// dictionary with potential async functions as values
export type MaybeAsyncProps<T> = object & { [K in keyof T]: MaybeAsync<T[K]> }

// dictionary with potential promises as values
export type MaybePromiseProps<T> = object &
  { [K in keyof T]: MaybePromise<T[K]> }


// jsonable stuff
export type BasicType = string | number | boolean | void

export interface Dict<Leaf> {
  [key: string]: Leaf
}

export interface DeepDict<Leaf> {
  [key: string]: DeepDict<Leaf> | Leaf
}

export type BasicArray = Array<BasicType | BasicDict>
export type BasicDict = DeepDict<BasicType | BasicArray>

export type Jsonable =
  | BasicType
  | BasicArray
  | BasicDict

export interface KVStore<Opts> {
  set: (key: Jsonable, value: Jsonable, opts?: Opts) => Promise<Jsonable>
  get: (key: Jsonable, defaultValue: Jsonable) => Promise<Jsonable>
}

export type Path = string | string[]

export type Range<T> = { from: T; to: T }

export type TimeRange = Range<Date>


// stack/lifo, fifo, etc
export interface Buffer<T> {
  in: (value: T) => Promise<boolean>
  out: () => Promise<T>
}

export interface GenBuffer<T> {
  in: (value: T) => Promise<boolean>
  out: () => AsyncGenerator<T>
  flush: () => AsyncGenerator<T | undefined>
}
