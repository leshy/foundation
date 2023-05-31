import * as logger from './logger'
import * as configSystem from './configSystem'

type initArgs = {
  name: string
} & configSystem.LoadConfigArgs

export const init = <CONFIG extends configSystem.AppConfig>({
  name,
  ...configSystemArgs
}: initArgs):

  Promise<{
    logger: logger.Logger
    config: CONFIG
  }> =>
  configSystem.loadConfig<CONFIG>(configSystemArgs).then((config: CONFIG) => ({
    logger: logger.init({
      name: (config.name as string),
      env: config.env,
      transports: config.logger ? config.logger : { console: { enabled: true } }
    }),
    config
  }))
