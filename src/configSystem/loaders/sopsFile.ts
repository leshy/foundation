import { stat } from 'fs'
import { spawn } from 'child_process'
import { ConfigLoader, AppConfigLeaf } from '../base'
import { Maybe } from '../../types'

const run = (cmd: string, args: Array<string>): Promise<string> =>
  new Promise((resolve, reject) => {
    try {

      const proc = spawn(cmd, args)
      let stdout: string = ''
      let stderr: string = ''

      proc.stdout.on('data', function(data: Buffer) {
        stdout += data.toString()
      })

      proc.stderr.on('data', function(data: Buffer) {
        stderr += data.toString()
      })

      proc.on('close', function(code: number) {
        if (code != 0) {
          console.log("ERROR CODE CATCH!@")
          reject(stderr)
        } else {
          resolve(stdout)
        }
      })
    }

    catch (error) {
      console.log("CATCH!")
      reject(error)
    }
  })

const fileExists = (filePath: string): Promise<Boolean> =>
  new Promise((resolve, _) => {
    stat(filePath, (err, stats) => {
      if (err) {
        return resolve(false)
      }
      return resolve(stats.isFile())
    })
  })

export const sopsFile: ConfigLoader = async (
  path: string,
  verbose: boolean = false
): Promise<Maybe<AppConfigLeaf>> => {
  if (!(await fileExists(path))) {
    return
  }

  if (verbose) {
    console.log('decrypt SOPS', path)
  }

  console.log("RUNNY SOPSY")
  return run('sops', ['-d', path])
    .then(JSON.parse)
    .catch((error) => {
      console.error("CATCHY!!", error)
      console.error("Continuing init")
      return {}
    })

}
