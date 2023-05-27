import * as wrap from '../src/wrap'

describe('wrap', () => {
  test('applyDefaults', () => {
    type Config = {
      host: string
      port: number
    }

    type Ret = {
      host: string
      port: number
    }

    const testF = wrap.applyDefaults(
      { port: 80, host: 'localhost' },
      (config: Config): Ret => config
    )

    expect(testF()).toEqual({ host: 'localhost', port: 80 })
    expect(testF({})).toEqual({ host: 'localhost', port: 80 })
    expect(testF({ port: 22 })).toEqual({ host: 'localhost', port: 22 })
  })
})
