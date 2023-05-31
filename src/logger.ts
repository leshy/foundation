import { hostname } from 'os'
import { omit } from 'lodash'
import pino from 'pino'
import { Env } from './configSystem/base'

export type LoggerTransportConfig = {
    file?: { enabled: boolean, destination: string },
    console?: { enabled: boolean },
    datadog?: { enabled: boolean, apiKey: string, eu: boolean }
}

export type LoggerConfig = {
    name: string,
    env: Env,
    productionConsole?: boolean
    transports: LoggerTransportConfig
}

export type Logger = pino.Logger

export { pino }

export const init = (config: LoggerConfig): pino.Logger => {

    if (!config.productionConsole) {
        const targets: Array<pino.TransportTargetOptions> = []
        const transports = config.transports

        if (transports.console && transports.console.enabled) {
            targets.push({
                level: 'debug',
                target: 'pino-pretty',
                options: {}
            })
        }

        if (transports.file && transports.file.enabled) {
            targets.push({
                level: 'trace',
                target: 'pino/file',
                options: omit(transports.file, 'enabled')
            })
        }

        if (transports.datadog && transports.datadog.enabled) {
            targets.push({
                level: 'debug',
                target: './datadog',
                options: {
                    ...omit(transports.datadog, 'enabled'),
                    host: hostname()
                }
            })
        }

        return pino({
            base: {
                host: hostname(),
                service: config.name,
                env: config.env
            }
        }, pino.transport({ targets }))
    }

    return pino({
        base: {
            host: hostname(),
            service: config.name,
            env: config.env
        }
    })
}
