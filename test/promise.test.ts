import * as p from '../src/utils/promise'
import * as utils from '../src/utils'
import * as types from '../src/types'

describe('promise', () => {
  test('flow', () => {
    const testF1 = async (x: number) => x + 1
    const testF2 = (x: number) => x + 2
    const testF3 = async (x: number) => x + 3

    const target = p.flow(testF1, testF2, testF3)

    return expect(target(1)).resolves.toEqual(7)
  })

  describe('props', () => {
    const result = { fiz: 33, buzz: 'ho ho', blab: 99 }
    type ResultType = {
      fiz: number
      buzz: string
      blab: number
    }

    test('propsResolve', () => {
      const unresolvedPromises: types.MaybePromiseProps<ResultType> = {
        fiz: new Promise(resolve => setTimeout(() => resolve(33), 10)),
        buzz: 'ho ho',
        blab: new Promise(resolve => setTimeout(() => resolve(99), 20))
      }
      return expect(p.propsResolve(unresolvedPromises)).resolves.toEqual(result)
    })

    test('propsExecResolve', () => {
      const unresolvedPromises: types.MaybeAsyncProps<ResultType> = {
        fiz: (): Promise<number> =>
          new Promise(resolve => setTimeout(() => resolve(33), 10)),
        buzz: 'ho ho',
        blab: new Promise(resolve => setTimeout(() => resolve(99), 20))
      }
      return expect(
        p.propsResolve(utils.propsCall(unresolvedPromises))
      ).resolves.toEqual(result)
    })

    test('props', () => {
      const unresolvedPromises: types.MaybeAsyncProps<ResultType> = {
        fiz: (): Promise<number> =>
          new Promise(resolve => setTimeout(() => resolve(33), 10)),
        buzz: 'ho ho',
        blab: new Promise(resolve => setTimeout(() => resolve(99), 20))
      }
      return expect(utils.propsExec(unresolvedPromises)).resolves.toEqual(
        result
      )
    })
  })
})
