import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { trackTransaction, resetTrackedTransactions } from '../../lib/api';

// 定义Alkanes交易信息接口
interface AlkanesTransactionInfo {
  txid: string;
  time: number;
  size: number;
  vsize: number;
  fee: number | null;
  feeRate: number;
  from: string;
  gas: number;
  contractId: string;
  estimatedBlockHeight: number;
  priority: number;
  isHighFee: boolean;
  // RBF相关字段
  isRbf?: boolean;
  previousTxid?: string;
  gasChange?: number;
  rbfInfo?: string;
}

// 从环境变量获取API配置
const SANDSHREW_API_URL = process.env.NEXT_PUBLIC_SANDSHREW_API_URL || 'https://mainnet.sandshrew.io/v2/lasereyes';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANDSHREW_PROJECT_ID || 'lasereyes';

// 配置参数
const HIGH_FEE_COUNT = 300;        // 优先处理的高费率交易数量
const BATCH_SIZE = 50;             // 每批处理的交易数量
const MAX_CONCURRENT_BATCHES = 3;  // 同时处理的最大批次数
const MIN_HIGH_FEE_ALKANES = 10;   // 找到这么多高费率Alkanes交易后可以提前结束
const HIGH_FEE_THRESHOLD = 50;     // 高费率阈值 (sat/vB)

// 定义处理单个交易的函数
async function processTx(txid: string, mempool: any) {
  try {
    const response = await axios.post(SANDSHREW_API_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getrawtransaction',
      params: [txid, true]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Sandshrew-Project-ID': PROJECT_ID
      }
    });
    
    if (response.data.error || !response.data.result) {
      return null;
    }
    
    const tx = response.data.result;
    
    // 快速检查是否包含OP_RETURN输出
    let hasOpReturn = false;
    let opReturnFound = false;
    
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey && vout.scriptPubKey.asm && vout.scriptPubKey.asm.startsWith('OP_RETURN')) {
          hasOpReturn = true;
          opReturnFound = true;
          break;
        }
      }
    }
    
    // 如果有OP_RETURN，检查是否为Alkanes交易
    if (hasOpReturn) {
      const isAlkanesTx = isAlkanesTransaction(tx);
      
      if (isAlkanesTx) {
        // 从mempool数据中获取费率信息
        const mempoolInfo = mempool[tx.txid];
        const feeRate = mempoolInfo ? mempoolInfo.fees.base / mempoolInfo.vsize * 100000000 : null;
        
        // 提取交易相关信息
        const alkanesInfo: AlkanesTransactionInfo = {
          txid: tx.txid,
          time: Math.floor(Date.now() / 1000),
          size: tx.size,
          vsize: tx.vsize,
          fee: mempoolInfo ? mempoolInfo.fees.base : null,
          feeRate: feeRate || 0, // 设置默认值为0，避免null
          from: extractSenderAddress(tx),
          gas: feeRate || extractGasAmount(tx),
          contractId: extractContractId(tx),
          estimatedBlockHeight: 0, // 会在主函数中设置为当前区块高度+1
          priority: mempoolInfo ? mempoolInfo.fees.ancestor / mempoolInfo.ancestorsize * 100000000 : 0,
          isHighFee: feeRate ? feeRate > HIGH_FEE_THRESHOLD : false
        };
        
        // 追踪交易以检测RBF
        const trackedInfo = trackTransaction(tx, alkanesInfo.gas);
        
        // 如果是RBF交易，添加相关信息
        if (trackedInfo && trackedInfo.isRbf) {
          alkanesInfo.isRbf = true;
          alkanesInfo.previousTxid = trackedInfo.previousTxid;
          alkanesInfo.gasChange = trackedInfo.gasChange;
          
          // 添加详细说明
          const changeType = (trackedInfo.gasChange || 0) > 0 ? '增加' : '减少';
          const changeAmount = Math.abs(trackedInfo.gasChange || 0).toFixed(2);
          alkanesInfo.rbfInfo = `替换交易 ${trackedInfo.previousTxid}，Gas ${changeType} ${changeAmount} sat/vB`;
        }
        
        return { alkanesInfo, opReturnFound };
      }
    }
    
    return { alkanesInfo: null, opReturnFound };
  } catch (err) {
    console.error(`处理交易${txid}时出错:`, err);
    return { alkanesInfo: null, opReturnFound: false };
  }
}

// 定义批处理函数
async function processBatch(txids: string[], mempool: any) {
  const promises = txids.map(txid => processTx(txid, mempool));
  const results = await Promise.all(promises);
  
  // 分离结果
  const alkanesInfos = results
    .filter((r): r is { alkanesInfo: any; opReturnFound: boolean } => r !== null && r.alkanesInfo !== null)
    .map(r => r.alkanesInfo);
  const opReturnCount = results
    .filter((r): r is { alkanesInfo: any; opReturnFound: boolean } => r !== null)
    .filter(r => r.opReturnFound).length;
  
  return { alkanesInfos, opReturnCount };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.time('总处理时间');
    
    // 1. 获取当前区块高度（用于参考）
    const blockCountResponse = await axios.post(SANDSHREW_API_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getblockcount',
      params: []
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Sandshrew-Project-ID': PROJECT_ID
      }
    });
    
    if (blockCountResponse.data.error) {
      throw new Error(`获取区块高度失败: ${blockCountResponse.data.error.message}`);
    }
    
    const blockHeight = blockCountResponse.data.result;
    console.log(`当前区块高度: ${blockHeight}`);
    
    // 每24小时重置交易跟踪状态
    if (req.query.resetTracking === 'true' || Math.random() < 0.01) { // 1%概率自动重置
      resetTrackedTransactions();
      console.log('已重置交易跟踪状态');
    }
    
    // 2. 获取内存池中的交易列表
    console.time('获取内存池数据');
    const mempoolResponse = await axios.post(SANDSHREW_API_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getrawmempool',
      params: [true] // 详细模式，获取更多交易信息
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Sandshrew-Project-ID': PROJECT_ID
      }
    });
    console.timeEnd('获取内存池数据');
    
    if (mempoolResponse.data.error) {
      throw new Error(`获取内存池数据失败: ${mempoolResponse.data.error.message}`);
    }
    
    const mempool = mempoolResponse.data.result;
    const mempoolTxids = Object.keys(mempool);
    console.log(`内存池中的交易数量: ${mempoolTxids.length}`);
    
    // 3. 按费率分组处理交易
    console.time('交易分组处理');
    
    // 3.1 优先处理高费率交易
    const highFeeTxids = Object.keys(mempool)
      .sort((a, b) => {
        const feeRateA = mempool[a].fees.base / mempool[a].vsize;
        const feeRateB = mempool[b].fees.base / mempool[b].vsize;
        return feeRateB - feeRateA; // 按费率从高到低排序
      })
      .slice(0, HIGH_FEE_COUNT);
    
    // 3.2 筛选可能包含OP_RETURN的交易
    // Alkanes交易通常在200-1000字节范围，避免处理非标准大小交易
    const potentialOpReturnTxids = Object.keys(mempool)
      .filter(txid => !highFeeTxids.includes(txid)) // 排除已处理的高费率交易
      .filter(txid => {
        const tx = mempool[txid];
        return tx.vsize > 200 && tx.vsize < 1000; // 筛选可能的OP_RETURN交易
      });
    
    console.log(`优先处理高费率交易: ${highFeeTxids.length}笔`);
    console.log(`处理可能的OP_RETURN交易: ${potentialOpReturnTxids.length}笔`);
    
    // 合并两组交易ID，优先处理高费率交易
    const txidsToProcess = [...highFeeTxids, ...potentialOpReturnTxids];
    console.timeEnd('交易分组处理');
    
    // 4. 获取交易详情并分析
    let alkanesTransactions: any[] = [];
    let opReturnCount = 0;
    let processedCount = 0;
    
    console.time('交易处理');
    
    // 分批并行处理交易
    for (let i = 0; i < txidsToProcess.length;) {
      const batches = [];
      
      // 创建多个批次
      for (let j = 0; j < MAX_CONCURRENT_BATCHES; j++) {
        const start = i + j * BATCH_SIZE;
        if (start < txidsToProcess.length) {
          const end = Math.min(start + BATCH_SIZE, txidsToProcess.length);
          batches.push(processBatch(txidsToProcess.slice(start, end), mempool));
        }
      }
      
      // 并行执行多个批次
      const batchResults = await Promise.all(batches);
      
      // 合并结果
      for (const result of batchResults) {
        alkanesTransactions.push(...result.alkanesInfos);
        opReturnCount += result.opReturnCount;
      }
      
      // 更新处理计数
      const batchSize = batches.length * BATCH_SIZE;
      i += batchSize;
      processedCount += batchSize;
      
      console.log(`已处理 ${Math.min(processedCount, txidsToProcess.length)}/${txidsToProcess.length} 笔交易，发现 ${alkanesTransactions.length} 笔Alkanes交易`);
      
      // 如果已找到足够多的高费率Alkanes交易，可以提前停止
      const highFeeAlkanesCount = alkanesTransactions.filter(tx => tx.isHighFee).length;
      if (highFeeAlkanesCount >= MIN_HIGH_FEE_ALKANES && i > HIGH_FEE_COUNT) {
        console.log(`已找到${highFeeAlkanesCount}笔高费率Alkanes交易，提前结束扫描`);
        break;
      }
    }
    
    console.timeEnd('交易处理');
    
    // 5. 设置估计区块高度
    alkanesTransactions.forEach(tx => {
      tx.estimatedBlockHeight = blockHeight + 1;
    });
    
    // 6. 按gas费用从高到低排序交易
    alkanesTransactions.sort((a, b) => (b.gas || 0) - (a.gas || 0));
    
    console.log(`内存池中OP_RETURN交易总数: ${opReturnCount}`);
    console.log(`识别出的Alkanes交易总数: ${alkanesTransactions.length}`);
    console.log(`高费率Alkanes交易数量: ${alkanesTransactions.filter(tx => tx.isHighFee).length}`);
    
    // 7. 返回结果
    res.status(200).json({
      currentBlockHeight: blockHeight,
      mempoolTxCount: mempoolTxids.length,
      processedTxCount: processedCount,
      opReturnCount,
      alkanesTxCount: alkanesTransactions.length,
      rbfTxCount: alkanesTransactions.filter(tx => tx.isRbf).length,
      blockHash: null,
      blockTime: Math.floor(Date.now() / 1000),
      blockHeight,
      txCount: mempoolTxids.length,
      alkanesTransactions: alkanesTransactions.slice(0, 50),
      rbfTransactions: alkanesTransactions.filter(tx => tx.isRbf).slice(0, 20),
      // 添加竞争情况统计
      competitionStats: {
        totalTransactions: alkanesTransactions.length,
        highFeeCount: alkanesTransactions.filter(tx => tx.isHighFee).length,
        rbfCount: alkanesTransactions.filter(tx => tx.isRbf).length,
        avgFeeRate: alkanesTransactions.length ? (alkanesTransactions.reduce((sum, tx) => sum + tx.feeRate, 0) / alkanesTransactions.length).toFixed(2) : 0
      }
    });
    
    console.timeEnd('总处理时间');
    
  } catch (error: unknown) {
    console.error('API错误:', error);
    res.status(500).json({ error: `获取数据失败: ${error instanceof Error ? error.message : String(error)}` });
  }
}

// 检查交易是否为Alkanes交易的辅助函数
function isAlkanesTransaction(tx: { vout?: any[]; txid?: string }): boolean {
  try {
    // 1. 检查OP_RETURN输出
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey) {
          const asm = vout.scriptPubKey.asm || '';
          const hex = vout.scriptPubKey.hex || '';
          
          // Alkanes协议特征 - OP_RETURN 加上特定的数据结构
          if (asm.startsWith('OP_RETURN')) {
            // 检查是否包含Alkanes常见操作码
            if (asm.includes('OP_PUSHNUM_13') || 
                asm.includes('OP_PUSHBYTES_14') ||
                asm.includes('OP_PUSHBYTES_20')) {
              return true;
            }
            
            // 检查是否包含Runestone标识
            if (asm.includes('Runestone')) {
              return true;
            }
            
            // 检查十六进制模式 - Alkanes通常以6a开头(OP_RETURN)
            if (hex.startsWith('6a')) {
              // 根据Alkanes数据结构特征 - 常见格式为14-20字节长度的数据
              const dataLength = hex.length - 2;
              if (dataLength >= 28 && dataLength <= 40) { // 14-20字节 (每字节2个十六进制字符)
                return true;
              }
            }
          }
        }
      }
    }
    
    return false;
  } catch (err) {
    console.error('检查Alkanes交易时出错:', err);
    return false;
  }
}

// 提取发送者地址
function extractSenderAddress(tx: { vin?: any[] }): string {
  try {
    // 尝试从输入中获取地址
    if (tx.vin && tx.vin[0] && tx.vin[0].prevout) {
      return tx.vin[0].prevout.scriptPubKey?.address || '未知地址';
    }
    
    // 如果上面的方法失败，尝试从第一个输入的scriptSig获取地址
    if (tx.vin && tx.vin[0] && tx.vin[0].addresses && tx.vin[0].addresses.length > 0) {
      return tx.vin[0].addresses[0];
    }
    
    return '未知地址';
  } catch (error) {
    return '未知地址';
  }
}

// 提取gas金额
function extractGasAmount(tx: { fee?: number; vsize?: number; vin?: any[]; vout?: any[] }): number {
  try {
    // 从交易费用估算gas
    if (tx.fee && tx.vsize) {
      return parseFloat((tx.fee * 100000000 / tx.vsize).toFixed(2)); // sat/vB
    }
    
    // 如果fee信息不可用，尝试其他方法估算
    if (tx.vout && tx.vin) {
      let inputTotal = 0;
      let outputTotal = 0;
      
      // 计算输入总额
      tx.vin.forEach((input: any) => {
        if (input.prevout && input.prevout.value) {
          inputTotal += input.prevout.value;
        }
      });
      
      // 计算输出总额
      tx.vout.forEach((output: any) => {
        if (output.value) {
          outputTotal += output.value;
        }
      });
      
      // 交易费用 = 输入 - 输出
      const fee = inputTotal - outputTotal;
      if (fee > 0 && tx.vsize) {
        return parseFloat((fee * 100000000 / tx.vsize).toFixed(2)); // sat/vB
      }
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
}

// 提取合约ID
function extractContractId(tx: { vout?: any[] }): string {
  try {
    // 从OP_RETURN数据中提取合约ID
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey && vout.scriptPubKey.asm && vout.scriptPubKey.asm.includes('OP_RETURN')) {
          const asm = vout.scriptPubKey.asm;
          
          // 基于OP_PUSHBYTES_14/OP_PUSHNUM_13提取数据
          if (asm.includes('OP_PUSHBYTES_14')) {
            const match = asm.match(/OP_PUSHBYTES_14\s+([a-fA-F0-9]+)/);
            if (match && match[1]) {
              return match[1];
            }
          }
          
          // 尝试从Runestone中提取
          if (asm.includes('Runestone')) {
            return 'Runestone:' + asm.split(' ')[2];
          }
          
          // 常见格式：OP_RETURN + 数据
          const parts = asm.split(' ');
          if (parts.length >= 3) {
            return parts[2];
          }
          
          // 如果上述都失败，尝试从hex中提取
          if (vout.scriptPubKey.hex && vout.scriptPubKey.hex.startsWith('6a')) {
            return vout.scriptPubKey.hex.substring(4, 20); // 简单示例，实际可能需要更复杂的解析
          }
        }
      }
    }
    return '';
  } catch (error) {
    return '';
  }
} 