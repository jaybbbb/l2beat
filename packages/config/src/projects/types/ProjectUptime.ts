export interface RpcEstimateGas {
  /** Estimate gas of sending 1 wei */
  action: 'rpc_estimateGas'
  /** RPC url of chain public node */
  url: string
  /** Address sending estimate gas transaction */
  from: string
  /** Receiver address */
  to: string
}

export interface RpcGetBalance {
  /** Get balance of some token */
  action: 'rpc_getBalance'
  /** RPC url of chain public node */
  url: string
  /** Token that we calculate balance of */
  to: string
  /** ABI encoded transaction data */
  data: string
}

export interface ApiCheck {
  action:
    | 'dydx_checkTrades'
    | 'loopring_checkTrades'
    | 'zksync_checkBlock'
    | 'immutablex_checkTrades'
    | 'zkspace_checkTrades'
    | 'starknet_checkBlock'
    | 'hermez_checkBatch'
  /** API url of a rollup operator */
  url: string
}

export interface ApiCheckWithBody {
  action: 'aztec_checkBlock'
  url: string
  body: string
}

export type ProjectUptime =
  | RpcEstimateGas
  | RpcGetBalance
  | ApiCheck
  | ApiCheckWithBody
