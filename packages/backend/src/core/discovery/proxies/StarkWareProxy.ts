import { Bytes, EthereumAddress, Hash256 } from '@l2beat/types'
import { BigNumber, utils } from 'ethers'

import { DiscoveryProvider } from '../provider/DiscoveryProvider'
import { bytes32ToAddress } from '../utils/address'
import { getCallResult, getCallResultWithRevert } from '../utils/getCallResult'
import { ProxyDetection } from './types'

// keccak256("StarkWare2019.implemntation-slot")
const IMPLEMENTATION_SLOT = Bytes.fromHex(
  '0x177667240aeeea7e35eabe3a35e18306f336219e1386f7710a6bf8783f761b24',
)

async function getImplementation(
  provider: DiscoveryProvider,
  address: EthereumAddress,
) {
  return bytes32ToAddress(
    await provider.getStorage(address, IMPLEMENTATION_SLOT),
  )
}

// keccak256("'StarkWare2020.CallProxy.Implemntation.Slot'")
const CALL_IMPLEMENTATION_SLOT = Bytes.fromHex(
  '0x7184681641399eb4ad2fdb92114857ee6ff239f94ad635a1779978947b8843be',
)

async function getCallImplementation(
  provider: DiscoveryProvider,
  address: EthereumAddress,
) {
  return bytes32ToAddress(
    await provider.getStorage(address, CALL_IMPLEMENTATION_SLOT),
  )
}

// Web3.solidityKeccak(['string'], ['StarkWare.Upgradibility.Delay.Slot'])
const UPGRADE_DELAY_SLOT = Bytes.fromHex(
  '0xc21dbb3089fcb2c4f4c6a67854ab4db2b0f233ea4b21b21f912d52d18fc5db1f',
)

async function getUpgradeDelay(
  provider: DiscoveryProvider,
  address: EthereumAddress,
) {
  const value = await provider.getStorage(address, UPGRADE_DELAY_SLOT)
  return BigNumber.from(value.toString()).toNumber()
}

// Web3.solidityKeccak(['string'], ["StarkWare2019.finalization-flag-slot"]).
const FINALIZED_STATE_SLOT = Bytes.fromHex(
  '0x7184681641399eb4ad2fdb92114857ee6ff239f94ad635a1779978947b8843be',
)

async function getFinalizedState(
  provider: DiscoveryProvider,
  address: EthereumAddress,
) {
  return !BigNumber.from(
    await provider.getStorage(address, FINALIZED_STATE_SLOT),
  ).eq(0)
}

async function getDiamondStatus(
  provider: DiscoveryProvider,
  address: EthereumAddress,
) {
  try {
    await getCallResultWithRevert(
      provider,
      address,
      'function nonExistentMethodName() view returns (uint)',
    )
    // This should actually never succeed
    return false
  } catch (e) {
    return (
      e instanceof Error && e.message.includes('"NO_CONTRACT_FOR_FUNCTION"')
    )
  }
}

async function detect(
  provider: DiscoveryProvider,
  address: EthereumAddress,
): Promise<ProxyDetection | undefined> {
  const implementation = await getImplementation(provider, address)
  if (implementation === EthereumAddress.ZERO) {
    return
  }
  const [callImplementation, upgradeDelay, isFinal, isDiamond] =
    await Promise.all([
      getCallImplementation(provider, address),
      getUpgradeDelay(provider, address),
      getFinalizedState(provider, address),
      getDiamondStatus(provider, address),
    ])

  if (isDiamond) {
    console.log('StarkWare diamond detected for', address)
    return await getStarkWareDiamond(
      provider,
      address,
      implementation,
      upgradeDelay,
      isFinal,
    )
  }

  return {
    implementations:
      callImplementation !== EthereumAddress.ZERO
        ? [implementation, callImplementation]
        : [implementation],
    relatives: [],
    upgradeability: {
      type: 'StarkWare proxy',
      implementation,
      callImplementation,
      upgradeDelay,
      isFinal,
    },
  }
}

async function getStarkWareDiamond(
  provider: DiscoveryProvider,
  address: EthereumAddress,
  implementation: EthereumAddress,
  upgradeDelay: number,
  isFinal: boolean,
): Promise<ProxyDetection> {
  const upgrades = await provider.getLogs(address, [
    // Upgraded (address indexed implementation)
    '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
  ])

  const lastUpgrade = upgrades.at(-1)?.transactionHash
  if (!lastUpgrade) {
    throw new Error('Diamond without upgrades!?')
  }

  const tx = await provider.getTransaction(Hash256(lastUpgrade))
  console.log('Got last upgrade data')

  const abi = new utils.Interface([
    'function upgradeTo(address newImplementation, bytes data, bool finalize)',
  ])
  const data = abi.decodeFunctionData('upgradeTo', tx.data).data as string

  // we subtract 2 for '0x' and 1 for an external initializer contract
  const maxAddresses = Math.floor((data.length - 2) / 64) - 1

  const facets: Record<string, EthereumAddress> = {}
  for (let i = 0; i < maxAddresses; i++) {
    const bytes32 = data.slice(2 + 64 * i, 2 + 64 * (i + 1))
    if (!bytes32.startsWith('0'.repeat(24))) {
      break
    }
    const facet = EthereumAddress('0x' + bytes32.slice(24))
    const name = await getCallResult<string>(
      provider,
      facet,
      'function identify() view returns (string)',
    )
    if (!name) {
      break
    }
    console.log(`${address.toString()}.${name} =`, facet)
    facets[name] = facet
  }

  return {
    implementations: [implementation, ...Object.values(facets)],
    relatives: [],
    upgradeability: {
      type: 'StarkWare diamond',
      implementation,
      upgradeDelay,
      isFinal,
      facets,
    },
  }
}

export const StarkWareProxy = {
  getImplementation,
  getCallImplementation,
  getUpgradeDelay,
  detect,
}
