import { reduce, startsWith, get, set, tail } from 'lodash'
import { isDict } from '../../utils'
import { ConfigLoader, AppConfigLeaf } from '../base'

export const env: ConfigLoader = (verbose: boolean = false): AppConfigLeaf =>
  reduce(
    process.env,
    (total, val, key) => {
      if (!startsWith(key, 'lenus_')) {
        return total
      }

      const path = tail(key.split('_'))

      const collision = get(total, path)
      if (collision) {
        console.warn(
          `ENV variable at path "${key}" defined both as dict and a value`
        )
        if (isDict(collision)) {
          return total
        }
      }

      const uglyMagic = (val?: string): string | boolean | void => {
        if (val === 'true') {
          return true
        }
        if (val === 'false') {
          return false
        }
        return val
      }

      if (verbose) {
        console.log('loading env var', key)
      }

      return set(total, path, uglyMagic(val))
    },
    {}
  )
