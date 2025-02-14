export interface ProxyDetection {
  upgradeability: UpgradeabilityParameters
  implementations: string[]
  relatives: string[]
}

export type UpgradeabilityParameters =
  | ImmutableUpgradeability
  | GnosisSafeUpgradeability
  | EIP1967ProxyUpgradeability
  | LoopringProxyUpgradeability
  | StarkWareProxyUpgradeability
  | StarkWareDiamondUpgradeability
  | ArbitrumProxyUpgradeability
  | ResolvedDelegateProxyUpgradeability
  | EIP897ProxyUpgradeability
  | CustomProxyUpgradeability

export interface ImmutableUpgradeability {
  type: 'immutable'
}

export interface GnosisSafeUpgradeability {
  type: 'gnosis safe'
}

export interface EIP1967ProxyUpgradeability {
  type: 'EIP1967 proxy'
  admin: string
  implementation: string
}

export interface LoopringProxyUpgradeability {
  type: 'Loopring proxy'
  owner: string
  implementation: string
}

export interface StarkWareProxyUpgradeability {
  type: 'StarkWare proxy'
  implementation: string
  callImplementation: string
  upgradeDelay: number
  isFinal: boolean
}

export interface StarkWareDiamondUpgradeability {
  type: 'StarkWare diamond'
  implementation: string
  upgradeDelay: number
  isFinal: boolean
  facets: Record<string, string>
}

export interface ArbitrumProxyUpgradeability {
  type: 'arbitrum proxy'
  admin: string
  adminImplementation: string
  userImplementation: string
}

export interface ResolvedDelegateProxyUpgradeability {
  type: 'resolved delegate proxy'
  addressManager: string
  implementationName: string
  implementation: string
}

export interface EIP897ProxyUpgradeability {
  type: 'EIP897 proxy'
  isUpgradable: boolean
  implementation: string
}

export interface CustomProxyUpgradeability {
  type: 'custom proxy'
  implementations: string[]
}
