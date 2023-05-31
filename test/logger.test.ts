import { Env } from '../src/configSystem/base'
import * as logger from '../src/logger'

describe('logger', () => {
  test('init console json', () => {
    const l = logger.init({
      env: Env.Testing,
      name: 'foundation-test',
      productionConsole: true,
      transports: {
        console: { enabled: false },
      }
    })

    l.info({ somedata: 3, pino: true, }, "a message from pino production logger")

    const ll = l.child({ service: "foundation-test-child" })
    ll.info({ somedata: 4, pino: true }, "forked production logger into a child and renamed a service console")
  })
})
