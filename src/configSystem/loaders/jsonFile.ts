import { readFile } from 'fs'
import { ConfigLoader, AppConfigLeaf } from '../base'

export const jsonFile: ConfigLoader = (
  path: string,
  verbose: boolean = false
): Promise<AppConfigLeaf> =>
  new Promise((resolve, _) => {
    if (verbose) {
      console.log('load JSON', path)
    }
    readFile(path, (err, buffer: Buffer) => {
      if (err) {
        return resolve({})
      }
      try {
        const parsed = JSON.parse(buffer.toString('utf8'))
        resolve(parsed || {})
      } catch (parseErr) {
        console.error('parsing error on', path)
        console.error(parseErr)
        process.exit(1)
      }
    })
  })
