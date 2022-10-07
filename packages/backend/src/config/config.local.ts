import { LogLevel } from '@l2beat/common'
import { bridges, layer2s, tokenList } from '@l2beat/config'
import { UnixTime } from '@l2beat/types'
import { config as dotenv } from 'dotenv'

import { bridgeToProject, layer2ToProject } from '../model'
import { Config } from './Config'
import { getEnv } from './getEnv'

export function getLocalConfig(): Config {
  dotenv()
  return {
    name: 'Backend/Local',
    logger: {
      logLevel: getEnv.integer('LOG_LEVEL', LogLevel.INFO),
      format: 'pretty',
    },
    port: getEnv.integer('PORT', 3000),
    coingeckoApiKey: process.env.COINGECKO_API_KEY, // this is optional
    alchemyApiKey: getEnv('ALCHEMY_API_KEY'),
    etherscanApiKey: getEnv('ETHERSCAN_API_KEY'),
    databaseConnection: getEnv('LOCAL_DB_URL'),
    core: {
      // TODO: This should probably be configurable
      minBlockTimestamp: UnixTime.now().add(-7, 'days').toStartOf('hour'),
      safeBlockRefreshIntervalMs: 30 * 1000,
      safeTimeOffsetSeconds: 60 * 60,
    },
    tokens: tokenList.map((token) => ({
      ...token,
      priceStrategy: { type: 'market' },
    })),
    projects: layer2s.map(layer2ToProject).concat(bridges.map(bridgeToProject)),
    syncEnabled: !getEnv.boolean('SYNC_DISABLED', false),
    freshStart: getEnv.boolean('FRESH_START', false),
    tvlReportSync: true,
    eventsSync: getEnv.boolean('EVENTS_ENABLED', false),
    transactionCountSync: getEnv.boolean(
      'TRANSACTION_COUNT_ENABLED',
      false,
    ) && {
      starkexApiUrl: getEnv('STARKEX_API_URL'),
      starkexApiKey: getEnv('STARKEX_API_KEY'),
      arbitrumAlchemyApiKeys: getEnv.stringArray('ARBITRUM_ALCHEMY_API_KEYS'),
      optimismAlchemyApiKeys: getEnv.stringArray('OPTIMISM_ALCHEMY_API_KEYS'),
      ethereumAlchemyApiKey: getEnv('ALCHEMY_API_KEY'),
      rpcWorkQueueLimit: 10_000,
      rpcWorkQueueWorkers: 1,
      zkSyncWorkQueueWorkers: 1,
      starkexWorkQueueWorkers: 1,
      starkexCallsPerMinute: 10,
      loopringWorkQueueWorkers: 1,
      loopringCallsPerMinute: 10,
    },
  }
}
