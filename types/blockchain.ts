// 区块类型定义
export interface Block {
  hash: string;
  confirmations: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: Transaction[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash?: string;
  nextblockhash?: string;
}

// 交易类型定义
export interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  hex: string;
  blockHash?: string;
  blockHeight?: number;
  confirmations?: number;
  blockTime?: number;
  time?: number;
}

// 交易输入
export interface TxInput {
  txid?: string;
  vout?: number;
  scriptSig?: {
    asm: string;
    hex: string;
  };
  sequence: number;
  coinbase?: string;
  txinwitness?: string[];
}

// 交易输出
export interface TxOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
    address?: string;
  };
}

// 地址信息
export interface Address {
  address: string;
  scriptPubKey: string;
  ismine: boolean;
  iswatchonly: boolean;
  isscript: boolean;
  iswitness: boolean;
  witness_version?: number;
  witness_program?: string;
  script?: string;
  hex?: string;
  pubkeys?: string[];
  sigsrequired?: number;
  pubkey?: string;
  embedded?: any;
  iscompressed?: boolean;
  label?: string;
  timestamp?: number;
  hdkeypath?: string;
  hdseedid?: string;
  hdmasterfingerprint?: string;
  labels?: any[];
}

// UTXO
export interface UTXO {
  txid: string;
  vout: number;
  address: string;
  label?: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
  solvable: boolean;
  desc?: string;
  safe?: boolean;
}

// Alkanes合约
export interface AlkanesContract {
  id: string;
  deployTxid: string;
  blockHeight: number;
  deployedAt: number;
  bytecodeSize: number;
  abi?: ContractABI[];
  deployer?: string;
}

// 合约方法
export interface ContractABI {
  name: string;
  type: 'function' | 'constructor' | 'event';
  inputs: ContractParam[];
  outputs?: ContractParam[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
}

// 合约参数
export interface ContractParam {
  name: string;
  type: string;
  components?: ContractParam[];
  indexed?: boolean;
} 