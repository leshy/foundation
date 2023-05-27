import { loadConfig, TestConfig } from './index'
import { Env } from '../src/configSystem/base'
import * as loggerPino from '../src/logger'
import * as loggerWinston from '../src/loggerWinston'

let config: TestConfig

describe('loggers', () => {
  beforeAll(() => loadConfig().then((loaded: TestConfig) => (config = loaded)))

  describe('loggerPino', () => {
    test('init console json', () => {
      const l = loggerPino.init({
        env: Env.Testing,
        name: 'data-shared-test',
        productionConsole: true,
        transports: {
          console: { enabled: false },
        }
      })

      l.info({ somedata: 3, pino: true, }, "a message from pino production logger")

      const ll = l.child({ service: "data-shared-test-child" })
      ll.info({ somedata: 4, pino: true }, "forked production logger into a child and renamed a service console")
    })

    test('init dd', () => {
      const l = loggerPino.init({
        env: Env.Testing,
        name: 'data-shared-test',
        transports: {
          console: { enabled: true },
          datadog: {
            enabled: true,
            eu: true,
            apiKey: "9820a5815b1f4c4d7c611f776c841f9b",
          }
        },
      })

      l.info({ somedata: 3, pino: true }, "a message from pino logger")

      const ll = l.child({ service: "data-shared-test-child" })
      ll.info({ somedata: 4, pino: true }, "forked into a child and renamed a service")
    })


  })

  test('datadog', () => {
    const l = loggerWinston.init({
      name: 'data-shared-test',
      env: Env.Testing,
      transport: {
        datadog: {
          enabled: true,
          apiKey: "9820a5815b1f4c4d7c611f776c841f9b",
        }
      }
    })

    //@ts-ignore
    l.on('finish', function(info) {
      console.log("INFO", info)
    })

    //@ts-ignore
    l.on('error', function(err) { console.error(err) })
    l.log('info', 'test works', { "some": "data" })
  })

  test('console', () => {
    const l = loggerWinston.init({
      name: 'data-shared-test',
      env: Env.Testing,
      transport: {
        console: {
          enabled: true,
          json: true,
        }
      }
    })

    //@ts-ignore
    l.on('finish', function(info) {
      console.log("INFO", info)
    })

    //@ts-ignore
    l.on('error', function(err) { console.error(err) })
    l.log('info', 'test works', { "some": "data" })
  })


})
