import { loadConfig, TestConfig } from './index'
let config: TestConfig

describe('configSystem', () => {
  jest.setTimeout(30000)
  beforeAll(() => loadConfig().then((loaded: TestConfig) => (config = loaded)))

  test('basic', () => {
    // just checking if config was loaded
    expect(config.censorSecrets).toEqual(true)
    expect(config.env).toEqual('test')
    expect(config.mqtt.username).toEqual('testing')
  })
})
