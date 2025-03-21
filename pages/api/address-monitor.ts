import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// 从环境变量获取API配置
const SANDSHREW_API_URL = process.env.NEXT_PUBLIC_SANDSHREW_API_URL || 'https://mainnet.sandshrew.io/v2/lasereyes';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANDSHREW_PROJECT_ID || 'lasereyes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: '请提供有效的比特币地址' });
    }
    
    console.log(`正在监控地址: ${address}`);
    
    // 1. 获取与该地址相关的交易
    const addressResponse = await axios.post(SANDSHREW_API_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getaddressinfo',
      params: [address]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Sandshrew-Project-ID': PROJECT_ID
      }
    });
    
    if (addressResponse.data.error) {
      throw new Error(`获取地址信息失败: ${addressResponse.data.error.message}`);
    }
    
    // 提取交易列表
    const txids = addressResponse.data.result?.txids || [];
    console.log(`地址相关交易总数: ${txids.length}`);
    
    // 2. 获取Alkanes相关交易详情
    const alkanesTransactions = [];
    const transactionsMap = new Map();
    
    // 首先尝试使用专用API获取与地址相关的Alkanes交易
    try {
      const alkanesByAddressResponse = await axios.post(SANDSHREW_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alkanes_protorunesbyaddress',
        params: [{
          address,
          protocolTag: 'alkanes'
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Sandshrew-Project-ID': PROJECT_ID
        }
      });
      
      if (!alkanesByAddressResponse.data.error && alkanesByAddressResponse.data.result) {
        const alkaneData = alkanesByAddressResponse.data.result;
        console.log(`通过alkanes_protorunesbyaddress获取到${alkaneData.outpoints?.length || 0}笔交易`);
        
        // 处理返回的Alkanes数据
        // 这里根据实际API返回格式进行处理
      }
    } catch (error) {
      console.warn(`获取地址Alkanes交易失败，将使用备用方法`);
    }
    
    // 备用方法：获取所有交易详情并分析
    console.log(`开始检查地址所有相关交易...`);
    
    // 使用分页处理，避免一次请求过多数据
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(txids.length / PAGE_SIZE);
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, txids.length);
      const pageTransactions = [];
      
      console.log(`处理第${page + 1}/${totalPages}页交易 (${startIndex}-${endIndex-1})`);
      
      // 并行获取当前页的所有交易
      const transactionPromises = txids.slice(startIndex, endIndex).map(txid => 
        axios.post(SANDSHREW_API_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getrawtransaction',
          params: [txid, true]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Sandshrew-Project-ID': PROJECT_ID
          }
        }).then(response => {
          if (!response.data.error && response.data.result) {
            return response.data.result;
          }
          return null;
        }).catch(err => {
          console.error(`获取交易${txid}出错:`, err.message);
          return null;
        })
      );
      
      const transactions = await Promise.all(transactionPromises);
      
      // 处理当前页的交易
      for (const tx of transactions) {
        if (!tx) continue;
        
        // 检查是否为Alkanes交易
        if (isAlkanesTransaction(tx)) {
          const alkanesInfo = {
            txid: tx.txid,
            time: tx.time || (tx.blocktime || Math.floor(Date.now() / 1000)),
            size: tx.size,
            fee: tx.fee,
            feeRate: tx.fee ? (tx.fee * 100000000 / tx.vsize) : null, // sat/vB
            from: extractSenderAddress(tx),
            gas: extractGasAmount(tx),
            contractId: extractContractId(tx),
            isDieselCompetition: isDieselCompetition(tx)
          };
          
          alkanesTransactions.push(alkanesInfo);
          transactionsMap.set(tx.txid, tx);
        }
      }
    }
    
    // 按gas费用从高到低排序交易
    alkanesTransactions.sort((a, b) => (b.gas || 0) - (a.gas || 0));
    
    console.log(`地址相关的Alkanes交易总数: ${alkanesTransactions.length}`);
    
    // 3. 返回结果
    res.status(200).json({
      address,
      txCount: txids.length,
      alkanesTxCount: alkanesTransactions.length,
      alkanesTransactions,
      balance: addressResponse.data.result?.balance || 0,
      dieselCompetitionTxs: alkanesTransactions.filter(tx => tx.isDieselCompetition),
    });
    
  } catch (error: any) {
    console.error('API错误:', error);
    res.status(500).json({ error: `获取数据失败: ${error.message}` });
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

// 判断是否为Diesel竞争交易
function isDieselCompetition(tx: { vout?: any[]; fee?: number; vsize?: number }): boolean {
  try {
    // 检查OP_RETURN输出是否包含Diesel相关标识
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey) {
          const asm = vout.scriptPubKey.asm || '';
          const hex = vout.scriptPubKey.hex || '';
          
          // Diesel交易特征
          if (asm.includes('diesel') || 
              asm.includes('Diesel') || 
              hex.includes('64696573656c')) { // 'diesel'的十六进制
            return true;
          }
          
          // 检查是否为高gas费Alkanes交易 (潜在的Diesel竞争)
          if (tx.fee && tx.vsize) {
            const feeRate = tx.fee * 100000000 / tx.vsize; // sat/vB
            // 高费率交易可能是Diesel竞争
            if (feeRate > 50) { // 50 sat/vB 作为阈值
              return true;
            }
          }
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
} 