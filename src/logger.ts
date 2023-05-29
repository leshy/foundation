import { hostname } from 'os'
import fp from 'lodash/fp'
import { Env } from './configSystem/base'
import * as utils from './utils'
import { BasicDict } from './types'
import * as winston from 'winston'
import * as Transport from 'winston-transport'
const { createLogger, format } = winston

export interface Logger {
  log: (level: string, line: string, data?: any) => Logger
  child: (dict: BasicDict) => Logger
}

export function hrtimeToMs([ms, ns]: [number, number]) {
  return ms + ns / 1e6
}

export function measurePromiseTime(promise: Promise<any>): Promise<BigInt> {
  const start = process.hrtime.bigint()
  return promise.then(() => process.hrtime.bigint() - start)
}

export const DummyLogger: Logger = {
  log: (level: string, line: string, data: any): Logger => {
    console.log(level, line, data)
    return DummyLogger
  },
  child: (_: BasicDict) => DummyLogger
}

export enum LogLevel {
  error = 0,
  warn = 1,
  info = 2,
  http = 3,
  verbose = 4,
  debug = 5,
  silly = 6
}

// from https://github.com/itsfadnis/datadog-winston

export type LoggerTransportConfig = {
  enabled: boolean
}

export type DataDogConfig = LoggerTransportConfig & {
  apiKey: string,
  source?: string // The technology from which the logs originated
  tags?: { [tag: string]: string } // Metadata assoicated with the logs
  intakeRegion?: string // The datadog intake to use. set to eu to force logs to be sent to the EU specific intake
}

export type ConsoleConfig = LoggerTransportConfig & {
  json?: boolean
}

export type LoggerInitArgs = {
  env: Env
  name: string
  transport?: {
    datadog?: DataDogConfig,
    console?: ConsoleConfig
  }
}

export type LoggerInitOpts = LoggerInitArgs & {
  logLevel: LogLevel | string
}

const LoggerInitOptsDefaults = {
  logLevel: LogLevel.info,
  transport: {
    console: { enabled: true }
  }
}

export const stringLogLevel = (level: LogLevel | string) =>
  typeof level === 'string' ? level : LogLevel[level]

type TransportInitializer<CONFIG extends LoggerTransportConfig> = (config: CONFIG) => winston.transport

export const logCall = <ARGS extends Array<any>, RET>(
  logger: Logger,
  name: string,
  level: string | LogLevel,
  f: (...args: ARGS) => RET
): ((...args: ARGS) => RET) => {
  const stringLevel = stringLogLevel(level)
  return (...args: ARGS): RET => {
    logger.log(stringLevel, name + ' ' + JSON.stringify(args))
    return f(...args)
  }
}
// 4express4
type Req = { method: string; originalUrl: string; body: BasicDict }
export const loggingMiddleware = (
  logger: Logger,
  aditionalData?: (req: any) => string
) => (req: Req, _: any, next: Function) => {
  logger.log(
    'info',
    `${req.method} ${req.originalUrl} ${JSON.stringify(req.body)} ${aditionalData ? aditionalData(req) : ''
    }`
  )
  next()
}


export const init = (argOpts: LoggerInitArgs): Logger => {
  const opts: LoggerInitOpts = utils.deepMerge(LoggerInitOptsDefaults, argOpts)
  const TransportInitializers: { [key: string]: TransportInitializer<any> } = {

    datadog: (config: DataDogConfig): winston.transport => {
      const t = new winston.transports.Http({
        host: 'http-intake.logs.datadoghq.eu',
        path: `/api/v2/logs?dd-api-key=${config.apiKey}&ddsource=nodejs&service=${opts.name}`,
        ssl: true
      })
      t.on('error', console.error)
      return t
    },

    console: (config: ConsoleConfig): winston.transport => {
      function getConsoleConfig() {
        if (config.json) {
          return { format: format.json() }
        }
        else {
          const { consoleFormat } = require('winston-console-format')
          return {
            format: format.combine(
              format.colorize({ all: true }),
              format.padLevels(),
              consoleFormat({
                showMeta: true,
                metaStrip: ['timestamp', 'service'],
                inspectOptions: {
                  depth: 1,
                  colors: true,
                  maxArrayLength: 20,
                  breakLength: 120,
                  compact: Infinity
                }
              }))
          }
        }
      }
      return new winston.transports.Console(getConsoleConfig())
    }

  }

  const transports: Array<Transport> = fp.pipe(
    fp.filter(([_, config]) => config.enabled),
    fp.map(([name, config]) => TransportInitializers[name](config))
  )(fp.toPairs(opts.transport || {}) as Array<[string, LoggerTransportConfig]>)

  return createLogger({
    level: stringLogLevel(opts.logLevel),
    exitOnError: true,
    format: format.combine(
      format.timestamp(),
      format.ms(),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: opts.name, host: hostname() },
    transports
  })
}
