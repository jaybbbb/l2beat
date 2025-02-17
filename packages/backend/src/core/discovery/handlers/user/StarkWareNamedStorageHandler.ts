import { getErrorMessage } from '@l2beat/common'
import { Bytes, EthereumAddress } from '@l2beat/types'
import { utils } from 'ethers'
import * as z from 'zod'

import { DiscoveryProvider } from '../../provider/DiscoveryProvider'
import { Handler, HandlerResult } from '../Handler'
import { bytes32ToContractValue } from '../utils/bytes32ToContractValue'
import { logHandler } from '../utils/logHandler'

export type StarkWareNamedStorageHandlerDefinition = z.infer<
  typeof StarkWareNamedStorageHandlerDefinition
>
export const StarkWareNamedStorageHandlerDefinition = z.strictObject({
  type: z.literal('starkWareNamedStorage'),
  tag: z.string(),
  returnType: z.optional(z.enum(['address', 'bytes', 'number'])),
})

export class StarkWareNamedStorageHandler implements Handler {
  readonly dependencies = []

  constructor(
    readonly field: string,
    private readonly definition: StarkWareNamedStorageHandlerDefinition,
  ) {}

  async execute(
    provider: DiscoveryProvider,
    address: EthereumAddress,
  ): Promise<HandlerResult> {
    logHandler(this.field, [
      'Reading named storage at ',
      JSON.stringify(this.definition.tag),
    ])
    let storage: Bytes
    try {
      const slot = Bytes.fromHex(
        utils.solidityKeccak256(['string'], [this.definition.tag]),
      )
      storage = await provider.getStorage(address, slot)
    } catch (e) {
      return { field: this.field, error: getErrorMessage(e) }
    }
    return {
      field: this.field,
      value: bytes32ToContractValue(
        storage,
        this.definition.returnType ?? 'bytes',
      ),
    }
  }
}
