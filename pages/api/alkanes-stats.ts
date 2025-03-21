import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// 从环境变量获取API配置
const SANDSHREW_API_URL = process.env.NEXT_PUBLIC_SANDSHREW_API_URL || 'https://mainnet.sandshrew.io/v2/lasereyes';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANDSHREW_PROJECT_ID || 'lasereyes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. 获取当前区块高度
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
    
    // 2. 获取最近100个区块的哈希
    const blockHashes = [];
    const hashPromises = [];
    
    // 只查询最近100个区块，以免请求过多
    const startBlock = Math.max(blockHeight - 99, 0);
    
    for (let height = blockHeight; height >= startBlock; height--) {
      hashPromises.push(
        axios.post(SANDSHREW_API_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getblockhash',
          params: [height]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Sandshrew-Project-ID': PROJECT_ID
          }
        }).catch(e => ({ data: { result: null, error: e.message } }))
      );
    }
    
    const hashResponses = await Promise.all(hashPromises);
    
    for (const hashResponse of hashResponses) {
      if (hashResponse.data.result) {
        blockHashes.push(hashResponse.data.result);
      }
    }
    
    // 3. 获取每个区块的Alkanes统计数据
    // 为了避免请求过多，只详细分析最近20个区块
    const recentBlockHashes = blockHashes.slice(0, 20);
    const blockDetails = [];
    const blockPromises = [];
    
    for (const blockHash of recentBlockHashes) {
      blockPromises.push(
        axios.post(SANDSHREW_API_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getblock',
          params: [blockHash, 2] // 详细级别2获取完整交易信息
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Sandshrew-Project-ID': PROJECT_ID
          }
        }).catch(e => ({ data: { result: null, error: e.message } }))
      );
    }
    
    const blockResponses = await Promise.all(blockPromises);
    
    // 4. 处理区块数据，提取Alkanes相关统计
    let totalAlkanesTxs = 0;
    let totalGasUsed = 0;
    let totalDieselCompetitions = 0;
    let alkanesContractActivities: {[key: string]: number} = {};
    
    for (const blockResponse of blockResponses) {
      if (blockResponse.data.result) {
        const block = blockResponse.data.result;
        const blockStats: any = {
          height: block.height,
          hash: block.hash,
          time: block.time,
          txCount: block.tx.length,
          alkanesTxCount: 0,
          gasUsed: 0,
          dieselCompetitionCount: 0,
          contractActivities: {} as {[key: string]: number}
        };
        
        // 分析区块中的每笔交易
        if (block.tx && block.tx.length > 0) {
          for (const tx of block.tx) {
            // 检查是否为Alkanes交易
            if (isAlkanesTransaction(tx)) {
              blockStats.alkanesTxCount++;
              totalAlkanesTxs++;
              
              // 提取Gas信息
              const gas = extractGasAmount(tx);
              blockStats.gasUsed += gas;
              totalGasUsed += gas;
              
              // 检查是否为Diesel竞争交易
              if (isDieselCompetition(tx)) {
                blockStats.dieselCompetitionCount++;
                totalDieselCompetitions++;
              }
              
              // 提取合约信息
              const contractInfo = extractContractInfo(tx);
              if (contractInfo && contractInfo.type) {
                // 按合约类型统计活动
                const contractType = contractInfo.type;
                
                if (!blockStats.contractActivities[contractType]) {
                  blockStats.contractActivities[contractType] = 0;
                }
                blockStats.contractActivities[contractType]++;
                
                if (!alkanesContractActivities[contractType]) {
                  alkanesContractActivities[contractType] = 0;
                }
                alkanesContractActivities[contractType]++;
              }
            }
          }
        }
        
        blockDetails.push(blockStats);
      }
    }
    
    // 5. 尝试获取Alkanes协议整体统计数据
    let protocolStats: any = {};
    try {
      const statsResponse = await axios.post(SANDSHREW_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alkanes_stats',
        params: []
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Sandshrew-Project-ID': PROJECT_ID
        }
      }).catch(() => ({ data: { result: null } }));
      
      if (statsResponse.data.result) {
        protocolStats = statsResponse.data.result;
      }
    } catch (statsError: any) {
      console.warn(`获取Alkanes协议统计数据失败: ${statsError.message}`);
      // 使用我们自己计算的统计数据
      protocolStats = {
        totalTransactions: totalAlkanesTxs,
        totalGasUsed: totalGasUsed,
        totalDieselCompetitions: totalDieselCompetitions,
        contractActivities: alkanesContractActivities,
        recentBlocksAnalyzed: blockDetails.length
      };
    }
    
    // 6. 计算平均Gas费用
    const averageGasPerTx = totalAlkanesTxs > 0 ? (totalGasUsed / totalAlkanesTxs).toFixed(2) : '0';
    
    // 7. 返回统计结果
    res.status(200).json({
      currentBlock: blockHeight,
      recentBlocks: blockDetails,
      summary: {
        blocksAnalyzed: blockDetails.length,
        totalAlkanesTransactions: totalAlkanesTxs,
        totalGasUsed,
        totalDieselCompetitions,
        averageGasPerTransaction: parseFloat(averageGasPerTx),
        contractActivities: alkanesContractActivities
      },
      protocolStats
    });
    
  } catch (error: any) {
    console.error('API错误:', error);
    res.status(500).json({ error: `获取数据失败: ${error.message}` });
  }
}

// 检查交易是否为Alkanes交易的辅助函数
function isAlkanesTransaction(tx: any): boolean {
  try {
    // 检查OP_RETURN输出
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey) {
          const asm = vout.scriptPubKey.asm || '';
          
          // 根据OP_RETURN特征模式检查
          if (asm.startsWith('OP_RETURN') && 
             (asm.includes('OP_PUSHNUM_13') || 
              asm.includes('OP_PUSHBYTES_14'))) {
            return true;
          }
          
          // 其他可能的Alkanes特征
          if (asm.includes('Runestone') || 
              asm.includes('OP_RETURN') && asm.includes('OP_PUSHBYTES_20') && 
              (asm.includes('4e26f0d463f88fb687cca7972439f970a') || 
               asm.includes('b4c9c2c6f4bc2b4e4a9063ee4c03d8148'))) {
            return true;
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

// 提取gas费用信息
function extractGasAmount(tx: any): number {
  try {
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

// 提取合约信息
function extractContractInfo(tx: any): any {
  try {
    // 从OP_RETURN数据中提取合约信息
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey && vout.scriptPubKey.asm && vout.scriptPubKey.asm.includes('OP_RETURN')) {
          const asm = vout.scriptPubKey.asm;
          
          // 基于OP_PUSHBYTES_14/OP_PUSHNUM_13提取数据
          if (asm.includes('OP_PUSHBYTES_14')) {
            const match = asm.match(/OP_PUSHBYTES_14\s+([a-fA-F0-9]+)/);
            if (match && match[1]) {
              return { 
                type: 'AlkanesToken', 
                contractId: match[1],
                data: match[1]
              };
            }
          }
          
          // 尝试从Runestone中提取
          if (asm.includes('Runestone')) {
            return { 
              type: 'Runestone', 
              data: asm.split(' ')[2] 
            };
          }
          
          // 分析OP_RETURN数据以确定合约类型
          const parts = asm.split(' ');
          if (parts.length >= 3) {
            const data = parts[2];
            
            // 简化的合约类型判断逻辑
            if (data.startsWith('616c6b')) { // 'alk' 十六进制
              return { type: 'AlkanesToken', data };
            } else if (data.startsWith('6662') || data.startsWith('6272')) { // 'fb' 或 'br' 十六进制
              return { type: 'AlkanesBridge', data };
            } else {
              return { type: 'AlkanesContract', data };
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 判断是否为Diesel竞争交易
function isDieselCompetition(tx: any): boolean {
  try {
    // 检查OP_RETURN输出是否包含Diesel相关标识
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey) {
          const asm = vout.scriptPubKey.asm || '';
          // Diesel交易特征
          if (asm.includes('diesel') || 
              asm.includes('Diesel') || 
              asm.includes('0x64696573656c')) { // 'diesel'的十六进制
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
} 