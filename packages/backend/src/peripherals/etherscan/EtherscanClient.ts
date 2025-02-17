import {
  getErrorMessage,
  HttpClient,
  Logger,
  RateLimiter,
} from '@l2beat/common'
import { UnixTime } from '@l2beat/types'

import { stringAsInt } from '../../tools/types'
import { parseEtherscanResponse } from './parseEtherscanResponse'

export class EtherscanError extends Error {}

export class EtherscanClient {
  private readonly rateLimiter = new RateLimiter({
    callsPerMinute: 150,
  })

  constructor(
    private readonly etherscanApiKey: string,
    private readonly httpClient: HttpClient,
    private readonly logger: Logger,
  ) {
    this.logger = this.logger.for(this)
  }

  async getBlockNumberAtOrBefore(timestamp: UnixTime): Promise<number> {
    const result = await this.call('block', 'getblocknobytime', {
      timestamp: timestamp.toString(),
      closest: 'before',
    })
    return stringAsInt().parse(result)
  }

  async call(module: string, action: string, params: Record<string, string>) {
    return this.rateLimiter.call(() =>
      this.callUnlimited(module, action, params),
    )
  }

  private async callUnlimited(
    module: string,
    action: string,
    params: Record<string, string>,
  ) {
    const query = new URLSearchParams({
      module,
      action,
      ...params,
      apikey: this.etherscanApiKey,
    })
    const url = `https://api.etherscan.io/api?${query.toString()}`

    const start = Date.now()
    const { httpResponse, error } = await this.httpClient
      .fetch(url, { timeout: 20_000 })
      .then(
        (httpResponse) => ({ httpResponse, error: undefined }),
        (error: unknown) => ({ httpResponse: undefined, error }),
      )
    const timeMs = Date.now() - start

    if (!httpResponse) {
      const message = getErrorMessage(error)
      this.recordError(module, action, timeMs, message)
      throw error
    }

    const text = await httpResponse.text()
    const etherscanResponse = tryParseEtherscanResponse(text)

    if (!httpResponse.ok) {
      this.recordError(module, action, timeMs, text)
      throw new Error(`Http error ${httpResponse.status}: ${text}`)
    }

    if (!etherscanResponse) {
      const message = 'Invalid Etherscan response.'
      this.recordError(module, action, timeMs, message)
      throw new TypeError(message)
    }

    if (etherscanResponse.message !== 'OK') {
      this.recordError(module, action, timeMs, etherscanResponse.result)
      throw new EtherscanError(etherscanResponse.result)
    }

    this.logger.debug({ type: 'success', timeMs, module, action })
    return etherscanResponse.result
  }

  private recordError(
    module: string,
    action: string,
    timeMs: number,
    message: string,
  ) {
    this.logger.debug({ type: 'error', message, timeMs, module, action })
  }
}

function tryParseEtherscanResponse(text: string) {
  try {
    return parseEtherscanResponse(text)
  } catch {
    return undefined
  }
}
