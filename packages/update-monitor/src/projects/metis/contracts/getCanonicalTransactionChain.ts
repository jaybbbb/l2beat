import { providers } from 'ethers'

import { getCallResultWithRevert } from '../../../common/getCallResult'
import { CanonicalTransactionChain__factory } from '../../../typechain'
import { ContractParameters } from '../../../types'
import { addresses } from '../constants'

export async function getCanonicalTransactionChain(
  provider: providers.JsonRpcProvider,
): Promise<ContractParameters> {
  const canonicalTransactionChain = CanonicalTransactionChain__factory.connect(
    addresses.canonicalTransactionChain,
    provider,
  )
  const addressManager: string =
    await canonicalTransactionChain.libAddressManager()

  const sequencerAddress = await getCallResultWithRevert<string>(
    provider,
    addressManager,
    'function getAddress(string implementationName) view returns(address)',
    ['1088_MVM_Sequencer'],
  )
  return {
    name: 'CanonicalTransactionChain',
    address: canonicalTransactionChain.address,
    upgradeability: { type: 'immutable' },
    values: {
      libAddressManager: addressManager,
      maxTransactionGasLimit: (
        await canonicalTransactionChain.maxTransactionGasLimit()
      ).toString(),
      l2GasDiscountDivisor: (
        await canonicalTransactionChain.l2GasDiscountDivisor()
      ).toString(),
      maxRollupTxSize: (
        await canonicalTransactionChain.MAX_ROLLUP_TX_SIZE()
      ).toString(),
      minRollupTxGas: (
        await canonicalTransactionChain.MIN_ROLLUP_TX_GAS()
      ).toString(),
      sequencer: sequencerAddress,
    },
  }
}
