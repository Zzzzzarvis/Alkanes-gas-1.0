// 模拟数据，用于前端开发
import { Block, Transaction, AlkanesContract } from '../types/blockchain';

// 生成随机哈希
const randomHash = () => {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// 生成模拟交易
const generateMockTransactions = (count: number, blockHeight: number, blockTime: number): Transaction[] => {
  return Array.from({ length: count }, (_, i) => ({
    txid: randomHash(),
    hash: randomHash(),
    version: 2,
    size: Math.floor(Math.random() * 1000) + 200,
    vsize: Math.floor(Math.random() * 800) + 200,
    weight: Math.floor(Math.random() * 3000) + 800,
    locktime: 0,
    vin: [
      {
        txid: randomHash(),
        vout: 0,
        scriptSig: {
          asm: '',
          hex: ''
        },
        sequence: 4294967295,
        txinwitness: ['', '']
      }
    ],
    vout: [
      {
        value: Math.random() * 10,
        n: 0,
        scriptPubKey: {
          asm: '',
          hex: '',
          type: 'witness_v0_keyhash',
          addresses: [`bc1q${randomHash().substring(0, 38)}`]
        }
      }
    ],
    hex: '',
    blockHeight,
    blockTime,
    time: blockTime
  }));
};

// 生成模拟区块
export const generateMockBlocks = (count: number): Block[] => {
  const currentTime = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, i) => {
    const height = 888450 - i; // 更接近当前比特币区块高度
    const time = currentTime - i * 600; // 约10分钟一个区块
    const txCount = Math.floor(Math.random() * 20) + 1;
    return {
      hash: randomHash(),
      confirmations: i,
      size: Math.floor(Math.random() * 10000) + 1000,
      weight: Math.floor(Math.random() * 30000) + 3000,
      height,
      version: 536870912,
      versionHex: '20000000',
      merkleroot: randomHash(),
      tx: generateMockTransactions(txCount, height, time),
      time,
      mediantime: time - 300,
      nonce: Math.floor(Math.random() * 10000000000),
      bits: '1a05db8b',
      difficulty: 48174374.44122773,
      chainwork: '00000000000000000000000000000000000000000000a3c9a8a22a54a89ace6b',
      nTx: txCount,
      previousblockhash: randomHash(),
      nextblockhash: i > 0 ? randomHash() : undefined
    };
  });
};

// 生成模拟合约
export const generateMockContracts = (count: number): AlkanesContract[] => {
  return Array.from({ length: count }, (_, i) => {
    const blockHeight = 1000000 - Math.floor(Math.random() * 1000);
    return {
      id: randomHash(),
      deployTxid: randomHash(),
      blockHeight,
      deployedAt: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 10000000),
      bytecodeSize: Math.floor(Math.random() * 5000) + 1000,
      deployer: `bc1q${randomHash().substring(0, 38)}`,
      abi: [
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [
            { name: 'success', type: 'bool' }
          ],
          stateMutability: 'nonpayable'
        },
        {
          name: 'balanceOf',
          type: 'function',
          inputs: [
            { name: 'account', type: 'address' }
          ],
          outputs: [
            { name: 'balance', type: 'uint256' }
          ],
          stateMutability: 'view'
        }
      ]
    };
  });
};

// 预生成的模拟数据
export const mockBlocks = generateMockBlocks(100);
export const mockContracts = generateMockContracts(50);

// 获取区块数量
export function getBlockCount(): Promise<number> {
  return Promise.resolve(mockBlocks[0].height);
}

// 通过高度获取区块
export function getBlockByHeight(height: number): Promise<Block | null> {
  const block = mockBlocks.find(b => b.height === height);
  return Promise.resolve(block || null);
}

// 通过哈希获取区块
export function getBlockByHash(hash: string): Promise<Block | null> {
  const block = mockBlocks.find(b => b.hash === hash);
  return Promise.resolve(block || null);
}

// 获取最近区块
export function getRecentBlocks(limit: number = 10): Promise<Block[]> {
  return Promise.resolve(mockBlocks.slice(0, limit));
}

// 通过ID获取交易
export function getTransaction(txid: string): Promise<Transaction | null> {
  let transaction: Transaction | null = null;
  for (const block of mockBlocks) {
    const tx = block.tx.find(t => t.txid === txid);
    if (tx) {
      transaction = tx;
      break;
    }
  }
  return Promise.resolve(transaction);
}

// getTransactionById 作为 getTransaction 的别名
export const getTransactionById = getTransaction;

// 获取合约列表
export function getAlkanesContracts(): Promise<AlkanesContract[]> {
  return Promise.resolve(mockContracts);
}

// 获取合约信息
export function getAlkanesContractInfo(contractId: string): Promise<AlkanesContract | null> {
  const contract = mockContracts.find(c => c.id === contractId);
  return Promise.resolve(contract || null);
}

// 获取地址信息
export function getAddressInfo(address: string): Promise<any> {
  return Promise.resolve({
    address,
    scriptPubKey: '',
    ismine: false,
    iswatchonly: false,
    isscript: false,
    iswitness: true,
    witness_version: 0,
    witness_program: '',
    transactions: mockBlocks.slice(0, 5).flatMap(b => b.tx).slice(0, 10),
    balance: Math.random() * 10
  });
}

// 获取地址的UTXO
export function getAddressUtxos(address: string): Promise<any[]> {
  return Promise.resolve([
    {
      txid: randomHash(),
      vout: 0,
      address,
      scriptPubKey: '',
      amount: Math.random() * 5,
      confirmations: Math.floor(Math.random() * 100),
      spendable: true,
      solvable: true
    },
    {
      txid: randomHash(),
      vout: 1,
      address,
      scriptPubKey: '',
      amount: Math.random() * 5,
      confirmations: Math.floor(Math.random() * 100),
      spendable: true,
      solvable: true
    }
  ]);
}

// 模拟区块执行结果
export function simulateAlkanesTransaction(): Promise<any> {
  return Promise.resolve({
    success: true,
    gasUsed: Math.floor(Math.random() * 1000000),
    returnValue: '0x0000000000000000000000000000000000000000000000000000000000000001'
  });
} 