import * as _ from 'lodash'
import { loadConfig, TestConfig } from './index'
import { KVStore, Pub, Sub } from '../src/types'

import * as pubsubModule from '../src/services/pubsub'
import * as kvstoreModule from '../src/services/kvstore'

export type ProviderInit<A> = (config: TestConfig) => Providers<A>
export type Providers<A> = { [name: string]: () => A }

export type PubSub = { pub: Pub<any>; sub: Sub<any> }

export const init = <A>(provider: ProviderInit<A>): Promise<Providers<A>> =>
  loadConfig().then((config: TestConfig) => provider(config))

export const pubsub: ProviderInit<PubSub> = (config: TestConfig) => ({
  redis: () => ({
    pub: new pubsubModule.redis.PubSub(
      { connection: {} },
      require('redis-mock')
    ),
    sub: new pubsubModule.redis.PubSub(
      { connection: {} },
      require('redis-mock')
    )
  }),
  mqtt: () => ({
    pub: new pubsubModule.mqtt.PubSub({
      ...config.mqtt,
      clientIdPrefix: 'testing_pub',
      msgOpts: { qos: 2, retain: false },
      clean: true
    }),
    sub: new pubsubModule.mqtt.PubSub({
      ...config.mqtt,
      clientIdPrefix: 'testing_sub',
      msgOpts: { qos: 2, retain: false },
      clean: true
    })
  })
})

export const kvstore: ProviderInit<KVStore<any>> = (config: TestConfig) => ({
  Redis: () =>
    new kvstoreModule.redis.Redis({ connection: {} }, require('redis-mock')),
  Mqtt: () => new kvstoreModule.mqtt.Mqtt(config.mqtt, 'testing/kv'),
  Memory: () => new kvstoreModule.memory.Memory()
})

//
// parametrized tests are really bad in mocha/jest
//
// https://github.com/mochajs/mocha/issues/1454
//
// all describe & test calls need to be executed synchroniously
//
// this casues arbitrary restrictions and is problematic with
// async config loading before tests for example
//
// this is some horribly confusing code that untagles this
// (allowes us to enumerate all the test cases in a sync manner,
// while loading config & initializing providers async)
//
export const configHost = <A>(provider: ProviderInit<A>) => {
  // @ts-ignore
  const config: TestConfig = {}
  return {
    loadConfig: () =>
      loadConfig().then((loaded: TestConfig) => _.extend(config, loaded)),
    providers: provider(config)
  }
}
