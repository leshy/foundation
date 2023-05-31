import * as path from 'path'
import * as util from 'util'
import { map, isArray, find } from 'lodash'
import { depthFirstMap, isDict } from '../utils'
import Ajv, { JSONSchemaType } from 'ajv'

// Base
// ==========================

import {
  AppConfig,
  AppConfigLeaf,
  Env,
  ConfigConfig,
  mergeByPriority
} from './base'

export { AppConfig, AppConfigLeaf, Env, ConfigConfig, mergeByPriority }

// Loader exports
// ==========================
import * as loader from './loaders'
export { loader }

// Code
// ==========================

// converts deep ConfigConfig into AppConfig
// just runs configLeafLoad via async deep depth first map
export const configEval = async (
  configConfig: ConfigConfig | ConfigConfig[]
): Promise<AppConfigLeaf> => {
  if (isArray(configConfig)) {
    return mergeByPriority(
      (
        await Promise.all(map(configConfig as ConfigConfig[], configEval))
      ).reverse()
    )
  }

  if (isDict(configConfig)) {
    const result: AppConfigLeaf = {}
    for (const [key, val] of Object.entries(configConfig)) {
      result[key] = await (isDict(val) ? configEval(val as ConfigConfig) : val)
    }
    return result
  }

  // since we are in an async function this will await for a potential loader promise

  return configConfig
}

const censoredKeys = [
  'cert',
  'connection',
  'password',
  'pass',
  'key',
  'token',
  'secret'
]

const shouldCensor = (key: string): boolean =>
  Boolean(
    find(censoredKeys, substring => key.toLowerCase().indexOf(substring) !== -1)
  )

const censorConfig = depthFirstMap((value: any, key: string) =>
  shouldCensor(key) ? '░░░░░░░░░░░░░░░░' : value
)


export type ConfigSystemSchema<T> = Omit<JSONSchemaType<T>, 'type'>

type LoadConfigOpts = {
  defaultConfig: AppConfigLeaf
  configDir: string
  env: Env
  verbose: boolean
  schema?: ConfigSystemSchema<Object>
}

export type LoadConfigArgs = {
  defaultConfig?: AppConfigLeaf
  configDir?: string
  verbose?: boolean
  env?: Env
  schema?: ConfigSystemSchema<Object>
}

const hardcodedDefaults: AppConfig = {
  censorSecrets: true,
  env: Env.Development,
  rootDir: path.join(__dirname, '../../../'),
}


const getEnv = (): Env => {
  switch (process.env. /* treeshake disable */ NODE_ENV && process.env.NODE_ENV.toLowerCase()) {
    case 'development':
      return Env.Development
    case 'testing':
      return Env.Testing
    case 'test':
      return Env.Testing
    case 'prod':
      return Env.Production
    case 'production':
      return Env.Production
    default:
      console.warn("ENV environment variable set to unknown value, defaulting to development")
      return Env.Development
  }
}

// TODO: this should always run only once.
// Create a caching loadConfig function, via caching promise wrapper util function
export const loadConfig = async <CONFIG extends AppConfig>(
  argOpts: LoadConfigArgs
): Promise<CONFIG> => {
  const defaultOpts: LoadConfigOpts = {
    defaultConfig: {},
    configDir: path.join(__dirname, '../../../config'),
    verbose: true,

    env: getEnv()
  }

  const opts: LoadConfigOpts = mergeByPriority([
    defaultOpts,
    argOpts
  ]) as LoadConfigOpts

  opts.defaultConfig.env = opts.env

  const verbose = opts.verbose

  if (verbose) {
    console.log('env:', opts.env)
    console.log('configdir:', opts.configDir, '\n')
  }

  const loadedConfig = ((await configEval([

    loader.env(verbose),

    loader.sopsFile(
      path.join(opts.configDir, opts.env + '.sops.json'),
      verbose
    ),

    loader.standardDir(
      path.join(opts.configDir, opts.env),
      verbose
    ),

    loader.jsonFile(
      path.join(opts.configDir, opts.env + '.json'),
      verbose
    ),

    loader.jsonFile(path.join(opts.configDir, 'shared.json'), verbose),
    loader.sopsFile(path.join(opts.configDir, 'shared.sops.json'), verbose),


    loader.standardDir(
      path.join(opts.configDir, 'shared'),
      verbose
    ),

    opts.defaultConfig,

    hardcodedDefaults
  ])) as unknown) as CONFIG

  if (verbose) {
    console.log(
      '\n' +
      util.inspect(
        loadedConfig.censorSecrets
          ? censorConfig(loadedConfig)
          : loadedConfig,
        { depth: 8, colors: true }
      ) +
      '\n'
    )
  }

  if (opts.schema) {
    const ajv = new Ajv()
    const schema = opts.schema

    const validate = ajv.compile({
      type: 'object',
      additionalProperties: false,
      ...schema,

      properties: {
        censorSecrets: { type: 'boolean' },
        env: { enum: ['test', 'development', 'production'] },
        rootDir: { type: 'string' },
        ...schema.properties
      },

      required: [
        'env',
        'censorSecrets',
        'rootDir',
        ...(schema.required ? schema.required : [])
      ]
    })

    if (!validate(loadedConfig)) {
      console.error('config schema validation failed')
      console.error(validate.errors)
      process.exit(100)
    } else if (verbose) {
      console.log('config schema ok')
    }
  }

  return loadedConfig
}

let config: AppConfig
export const loadConfigCached = <CONFIG extends AppConfig>(
  args: LoadConfigArgs
): Promise<CONFIG> => {
  // @ts-ignore
  return config ? Promise.resolve(config) : loadConfig(args)
}
