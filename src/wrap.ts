import { Dict } from './types'
import { deepMerge } from './utils'

export const applyDefaults = <T extends Dict<any>, RET>(
  defaultConfig: T,
  f: (argConfig: T) => RET
) => (optArgConfig?: Partial<T>): RET =>
    f(deepMerge(defaultConfig, optArgConfig || {}))
