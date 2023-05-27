import * as path from 'path'
import * as configSystem from '../src/configSystem'

export type MsgOpts = { retain: boolean; qos: number }

export type MqttConfig = {
  connection: string
  clean: boolean
  msgOpts: MsgOpts
  clientId?: string
  clientIdPrefix?: string
  username?: string
  password?: string
  reconnectPeriod: number
  will?: boolean
}

export type Config = MqttConfig

export const mqttConfigSchema = {
  type: "object",
  properties: {
    connection: { type: "string" },
    clean: { type: "boolean" },

    msgOpts: {
      type: "object",
      properties: {
        retain: { type: 'boolean' },
        QoS: {
          enum: [1, 2, 3]
        }
      },
      required: ['retain', 'QoS'],
      additionalProperties: false
    },

    clientId: { type: "string", pattern: ".+" },
    clientIdPrefix: { type: "string", pattern: ".+" },
    username: { type: "string", pattern: ".+" },
    password: { type: "string", pattern: ".+" },
    reconnectPeriod: { type: "number" },
    will: { type: "boolean" }

  },
  required: ["connection", "username", "password"],
  additionalProperties: false
}


export type TestConfig = {
  mqtt: MqttConfig
} & configSystem.AppConfig

export let config: TestConfig

const schema: configSystem.ConfigSystemSchema<TestConfig> = {
  properties: {
    mqtt: mqttConfigSchema
  },
  required: ["mqtt"],
}

export const loadConfig = () =>
  configSystem.loadConfig<TestConfig>({
    configDir: path.resolve('./test/config'),
    verbose: true,

    defaultConfig: {
      censorSecrets: true,
      mqtt: { clientIdPrefix: 'testing' }
    },

    schema
  })
