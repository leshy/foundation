import * as fs from 'fs'
import * as path from 'path'
import { Maybe } from '../../types'
import { ConfigLoader, ConfigLoaderOutput, AppConfigLeaf, mergeByPriority } from '../base'
import { mapFilter } from '../../utils'

const readDir = (dirPath: string): Promise<string[]> =>
  new Promise((resolve, _) => {
    if (!fs.existsSync(dirPath)) {
      return resolve([])
    }

    if (!fs.lstatSync(dirPath).isDirectory()) {
      return resolve([])
    }

    fs.readdir(dirPath, (err, items) => (err ? resolve([]) : resolve(items)))
  })


export type FileLoader = (path: string, verbose?: boolean) => ConfigLoaderOutput

export type FilePathMatcher = (path: string) => boolean

export type FileParser = {
  name: string,
  loader: FileLoader
  matcher: FilePathMatcher
}

export const dir = (parsers: FileParser[]): ConfigLoader => async (
  dirPath: string,
  verbose: boolean = false
): Promise<Maybe<AppConfigLeaf>> => {

  const loadDir: ConfigLoader = (dirPath) => {
    if (verbose) { console.log("dir", dirPath) }
    return readDir(dirPath)
      .then(
        (fileNames: string[]): Promise<AppConfigLeaf[]> =>
          Promise.all(
            mapFilter((fileName: string) => {
              const filePath = path.join(dirPath, fileName)

              const stat = fs.lstatSync(filePath)

              if (stat.isDirectory()) {
                return loadDir(filePath)
              }

              if (!stat.isFile()) {
                console.warn(`${filePath} is not a file`)
                return undefined
              }

              const parser = parsers.find(({ matcher }) => matcher(filePath))

              if (parser) {
                return parser.loader(filePath, verbose)
              }

              return undefined
            })(fileNames.sort().reverse())
          )
      )
      .then(mergeByPriority)
  }

  return loadDir(dirPath)
}

export const jsonRegex = new RegExp('^.+\.json$')
export const jsonSopsRegex = new RegExp('^.+\.sops\.json$')

import { jsonFile } from './jsonFile'
import { sopsFile } from './sopsFile'

export const standardDir: ConfigLoader = dir([
  {
    name: 'json',
    loader: jsonFile,
    matcher: ((path: string) => !Boolean(path.match(jsonSopsRegex)) && Boolean(path.match(jsonRegex))),
  },
  {
    name: 'sopsJson',
    loader: sopsFile,
    matcher: ((path: string) => Boolean(path.match(jsonSopsRegex))),
  }

])
