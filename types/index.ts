// 区块类型
export interface Block {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
  size: number;
}

// 交易类型
export interface Transaction {
  txid: string;
  blockHeight: number;
  timestamp: number;
  fee: number;
  size: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  isAlkanes: boolean;
  alkaneOperations?: AlkaneOperation[];
}

// 交易输入
export interface TxInput {
  txid: string;
  vout: number;
  address: string;
  value: number;
}

// 交易输出
export interface TxOutput {
  n: number;
  address: string;
  value: number;
}

// Alkane 操作
export interface AlkaneOperation {
  type: 'contract_deployment' | 'token_deployment' | 'transfer' | 'execute';
  contractId?: string;
  tokenId?: string;
  from?: string;
  to?: string;
  amount?: number;
  calldata?: string;
}

// 地址信息
export interface AddressInfo {
  address: string;
  balance: number;
  txCount: number;
  alkanes: AddressAlkanes[];
}

// 地址持有的 Alkanes
export interface AddressAlkanes {
  alkaneId: string;
  tokenName?: string;
  balance: number;
}

// 合约信息
export interface Contract {
  id: string;
  deployedAt: number;
  deployer: string;
  transactionId: string;
  blockHeight: number;
  bytecodeSize: number;
}

// API 响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 