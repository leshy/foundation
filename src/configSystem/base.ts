import { deepMerge } from '../utils'
import { Maybe, MaybePromise, DeepDict, BasicDict } from '../types'
import { LoggerTransportConfig } from '../logger'
/*
 * config system allows us to load configuration from multiple pluggable sources (ConfigLoader functions)
 * and merge them together into a single config object.
 *
 * the config system is designed to be used in a layered way, where each layer can be overriden by the next layer.
 *
 * */



// possible execution environments, this could be overriden by the host app
export enum Env {
  Production = 'production',
  Development = 'development',
  Testing = 'test'
}

export type AppConfigLeaf = BasicDict

// our app config is just a deep dict of base types and some keys that are required for every application
export type AppConfig = {
  env: Env
  censorSecrets: boolean
  rootDir: string

  // if we want a config system to log it's execution steps
  logger?: LoggerTransportConfig
} & BasicDict

// this is our plugable configuration loader function
// can accept any arguments, and returns a dictionary
// (given there are no issues, potentially wrapped in a promise)
export type ConfigLoader = (...args: any[]) => ConfigLoaderOutput
export type ConfigLoaderOutput = MaybePromise<Maybe<AppConfigLeaf>>

// this is how we configure the configuration :) tree of config loaders or arrays of config loaders..
// (arrays are specifying priority)
// the tree is deep so we can have config loaders that work a specific parts of a config tree
// (like maybe password loader can be specific, google config subtree loader can be specific etc..)
export type ConfigConfigLeaf =
  | ConfigLoaderOutput
  | ConfigLoaderOutput[]
  | AppConfig

export type ConfigConfig = DeepDict<ConfigConfigLeaf> | ConfigConfigLeaf[]

// merges arrays of deep objects into a single deep object
export const mergeByPriority = <Leaf>(
  configArray: DeepDict<Leaf>[]
): DeepDict<Leaf> => {
  return deepMerge(...configArray)
}
