import { Env } from '../src/configSystem/base'
import * as logger from '../src/logger'

describe('loggers', () => {

  test('console', () => {
    const l = logger.init({
      name: 'testservice',
      env: Env.Testing,
      transport: {
        console: {
          enabled: true
        }
      }
    })


    l.log('info', "a message from logger", { somedata: 3, pino: true, })

    const ll = l.child({ service: "testservice-child" })
    ll.log('info', "forked into a child and renamed a service", { somedata: 4, pino: true })


  })


})
