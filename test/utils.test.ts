import * as utils from '../src/utils'

describe('utils', () => {
  test('mutableDeepMergeTwo', () => {
    expect(
      utils.mutableDeepMergeTwo({ bla1: 1, bla2: 2 }, { bla2: 3, bla3: 4 })
    ).toEqual({ bla1: 1, bla2: 3, bla3: 4 })
  })

  test('mutableDeepMerge', () => {
    expect(
      utils.mutableDeepMerge(
        { bla1: { someDict: 1 }, bla2: 2 },
        { bla2: 3, bla3: 4 }
      )
    ).toEqual({ bla1: { someDict: 1 }, bla2: 3, bla3: 4 })
  })

  test('deepMerge', () => {
    expect(
      utils.deepMerge({ bla1: { someDict: 1 }, bla2: 2 }, { bla2: 3, bla3: 4 })
    ).toEqual({ bla1: { someDict: 1 }, bla2: 3, bla3: 4 })
  })

  test('args', () => {
    const wrapped = utils.args({ a: 1, b: 2 })(opts =>
      expect(opts).toEqual({ a: 1, b: 3 })
    )
    wrapped({ b: 3 })
  })


  test('isArray', () => {
    expect(utils.isArray([])).toEqual(true)
    expect(utils.isArray({})).toEqual(false)
    expect(utils.isArray(Infinity)).toEqual(false)
    expect(utils.isArray(Promise)).toEqual(false)
    expect(utils.isArray(undefined)).toEqual(false)
  })

  test('isDict', () => {
    expect(utils.isDict({})).toEqual(true)
    expect(utils.isDict([])).toEqual(false)
    expect(utils.isDict(Infinity)).toEqual(false)
    expect(utils.isDict(Promise)).toEqual(false)
    expect(utils.isDict(undefined)).toEqual(false)
  })

  test('argsSchema', () => {
    type Args = { foo: number; bar: string; baz?: number; }

    const wrapped = utils.argsSchema<Args, any>({
      type: 'object',
      properties: {
        foo: { type: 'number' },
        bar: { type: 'string', default: 'blop!' },
        baz: { type: 'number' },
      },
      required: ['foo', 'bar']
    })((opts: Args) => opts)

    expect(wrapped({ foo: 3 })).toEqual({ foo: 3, bar: 'blop!' })

    //@ts-ignore
    expect(() => wrapped({ foo: 'fail1', baz: 'fail2' })).toThrowError(
      utils.ArgumentValidationError
    )

    expect(wrapped({ foo: 3 })).toEqual({
      foo: 3,
      bar: 'blop!'
    })
  })
})
