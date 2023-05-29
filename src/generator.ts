import fp from 'lodash/fp'
import * as types from './types'

export type AsyncTransform<X, Y> = (x: X) => Promise<Y>
export type Transform<X, Y> = (x: X) => Y

export type MaybeAsyncTransform<X, Y> = AsyncTransform<X, Y> | Transform<X, Y>

export type Cb<X> = (x: X) => Promise<any> | any

// curry pipe
export const cpipe = fp.pipe

export const pipe = <X, Y>(
  input: AsyncGenerator<X>,
  ...chain: Function[]
): //@ts-ignore
  Y => fp.pipe(...chain)(input) as Y

export const filter = <X>(f: MaybeAsyncTransform<X, boolean>) =>
  async function*(iterator: AsyncGenerator<X>): AsyncGenerator<X> {
    for await (const el of iterator) {
      if (await f(el)) {
        yield el
      }
    }
  }

export const map = <X, Y>(f: MaybeAsyncTransform<X, Y>) =>
  async function*(iterator: AsyncGenerator<X>): AsyncGenerator<Y> {
    for await (const el of iterator) {
      yield await f(el)
    }
  }

export const probe = <X>(f: Cb<X>) =>
  async function*(iterator: AsyncGenerator<X>): AsyncGenerator<X> {
    for await (const el of iterator) {
      await f(el)
      yield el
    }
  }

export const window = <X>(n: number) =>
  async function*(iterator: AsyncGenerator<X>): AsyncGenerator<X[]> {
    let store: X[] = []
    for await (const el of iterator) {
      store.push(el)
      if (store.length === n) {
        yield store
        store = []
      }
    }
    if (store.length) {
      yield store
    }
  }

export async function* sequence(
  start: number,
  end: number
): AsyncGenerator<number> {
  for (let i = start; i <= end; i++) {
    yield i
  }
}

export const delay = <X>(delayTime: number = 1000) =>
  async function*(iterator: AsyncGenerator<X>): AsyncGenerator<X> {
    for await (const el of iterator) {
      await new Promise(resolve => setTimeout(resolve, delayTime))
      yield el
    }
  }

export const skip = <PAYLOAD>(start: number) =>
  async function*(node: AsyncGenerator<PAYLOAD>) {
    let counter = 0
    for await (const msg of node) {
      counter++
      if (counter > start) {
        yield msg
      }
    }
  }

export const limit = <PAYLOAD>(end: number) =>
  async function*(node: AsyncGenerator<PAYLOAD>) {
    let counter = 0
    for await (const msg of node) {
      counter++
      yield msg
      if (counter === end) {
        break
      }
    }
  }

export const slice = (start = 0, end = Infinity) =>
  fp.pipe(skip(start), limit(end))

export const pullCount = () => async <PAYLOAD>(
  node: AsyncGenerator<PAYLOAD>
): Promise<number> => {
  let cnt = 0
  for await (const msg of node) {
    msg
    cnt++
  }
  return cnt
}

export const pullAll = () => async <PAYLOAD>(node: AsyncGenerator<PAYLOAD>) => {
  for await (const msg of node) {
    msg
  }
}

export const pullArray = () => async <PAYLOAD>(
  node: AsyncGenerator<PAYLOAD>
) => {
  let ret: PAYLOAD[] = []
  for await (const msg of node) {
    ret.push(msg)
  }
  return ret
}

export const pull = (x?: number) =>
  x ? fp.pipe(limit(x), pullAll()) : pullAll()

export const catchLast = <PAYLOAD>(cb: MaybeAsyncTransform<PAYLOAD | void, any>) =>
  async function*(node: AsyncGenerator<PAYLOAD>) {
    let last: PAYLOAD | void
    for await (const event of node) {
      last = event
      yield event
    }
    return await cb(last)
  }

export const lifo = <PAYLOAD>(): types.BufferStore<PAYLOAD> => {
  const data: Array<PAYLOAD> = []
  let resolve: void | ((el: PAYLOAD) => any)

  return {
    in: (value: PAYLOAD) => {
      if (resolve) {
        resolve(value)
        resolve = undefined
      } else {
        data.push(value)
      }
      return Promise.resolve(true)
    },
    //@ts-ignore
    out: async function*() {
      while (true) {
        if (data.length > 0) {
          yield data.shift()
        } else {
          yield await new Promise(r => (resolve = r))
        }
      }
    },

    flush: async function*() {
      while (data.length) {
        yield data.shift()
      }
    }
  }
}

export const fifo = <PAYLOAD>(): types.BufferStore<PAYLOAD> => {
  const data: Array<PAYLOAD> = []
  let resolve: void | ((el: PAYLOAD) => any)

  return {
    in: (value: PAYLOAD) => {
      if (resolve) {
        resolve(value)
        resolve = undefined
      } else {
        data.push(value)
      }
      return Promise.resolve(true)
    },
    //@ts-ignore
    out: async function*() {
      while (true) {
        if (data.length > 0) {
          yield data.pop()
        } else {
          yield await new Promise(r => (resolve = r))
        }
      }
    },

    flush: async function*() {
      while (data.length) {
        yield data.pop()
      }
    }
  }
}

type BindBuffer<PAYLOAD> = (cb: (event: PAYLOAD) => any) => any
export const buffer = <PAYLOAD>(store: types.BufferStore<PAYLOAD>) => (
  bindBuffer: BindBuffer<PAYLOAD>
): AsyncGenerator<PAYLOAD> => {
  bindBuffer(store.in)
  return store.out()
}

export const bufferFifo = buffer(fifo())

export const bufferLifo = buffer(lifo())

// // sub.sub() -> lifoAsyncIterator
// export const subscribe = <Opts>(
//   sub: types.Sub<Opts>,
//   namespace: string,
//   opts?: Opts
// ) => bufferLifo(cb => sub.sub(namespace, cb, opts))

// iterator that retuns an iterator<iterator>
export type Selector = (msg: any) => string

export const by = <X>(selector: Selector) =>
  async function*(
    iterator: AsyncGenerator<X>,
    //iteratorCallback: IteratorCallback<X, any>
  ): AsyncGenerator<AsyncGenerator<X>> {
    const streams: { [name: string]: types.BufferStore<X> } = {}
    for await (const msg of iterator) {
      const name = selector(msg)
      if (!streams[name]) {
        streams[name] = lifo()
      }
      streams[name].in(msg)
      yield streams[name].out()
    }
  }

// iterator that retuns an iterator<iterator>
export type IteratorCallback<X, Y> = (
  streamName: string
) => (input: AsyncGenerator<X>) => AsyncGenerator<Y>

export type MetaIterator<X> = AsyncGenerator<AsyncGenerator<X>>

export const split = <IN, OUT>(
  selector: Selector,
  iteratorCallback: IteratorCallback<IN, OUT>
) =>
  async function*(iterator: AsyncGenerator<IN>): AsyncGenerator<OUT> {
    const streams: { [name: string]: any } = {}

    for await (const msg of iterator) {
      const name = selector(msg)
      if (!streams[name]) {
        streams[name] = iteratorCallback(name)
      }
    }
  }

export const collect = async function*<X>(
  metaIterator: AsyncGenerator<AsyncGenerator<X>>
): AsyncGenerator<X> {
  const drain = async <X>(
    buffer: types.BufferStore<X>,
    iterator: AsyncGenerator<X>
  ) => {
    for await (const msg of iterator) {
      buffer.in(msg)
    }
  }
  const buf = lifo()
  for await (const iterator of metaIterator) {
    drain(buf, iterator)
  }
  return buf.out()
}
