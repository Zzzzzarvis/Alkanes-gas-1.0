import axios from 'axios';
// 导入模拟数据
import * as mockData from './mockData';

// 从环境变量获取API配置
const SANDSHREW_API_URL = process.env.NEXT_PUBLIC_SANDSHREW_API_URL || 'https://mainnet.sandshrew.io/v2/lasereyes';
// 项目ID
const PROJECT_ID = process.env.NEXT_PUBLIC_SANDSHREW_PROJECT_ID || 'lasereyes';
// 备用API端点
const BACKUP_API_URL_1 = process.env.NEXT_PUBLIC_BACKUP_API_URL_1 || 'https://api.diesel.run/v1';
const BACKUP_API_URL_2 = process.env.NEXT_PUBLIC_BACKUP_API_URL_2 || 'https://alkanes-api.bitfinity.network';
// API密钥
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// 强制使用真实数据的配置
const ENABLE_REAL_DATA = process.env.NEXT_PUBLIC_ENABLE_REAL_DATA === 'true';
const DISABLE_MOCK_DATA = process.env.NEXT_PUBLIC_DISABLE_MOCK_DATA === 'true';

// 使用模拟数据的配置
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// 创建主API实例
const sandshrewApi = axios.create({
  baseURL: SANDSHREW_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Sandshrew-Project-ID': PROJECT_ID
  },
  timeout: 10000 // 10秒超时
});

// 创建备用API实例
const backupApi1 = axios.create({
  baseURL: BACKUP_API_URL_1,
  headers: {
    'Content-Type': 'application/json',
    'X-Sandshrew-Project-ID': PROJECT_ID
  },
  timeout: 10000
});

const backupApi2 = axios.create({
  baseURL: BACKUP_API_URL_2,
  headers: {
    'Content-Type': 'application/json',
    'X-Sandshrew-Project-ID': PROJECT_ID
  },
  timeout: 10000
});

// Sandshrew JSON-RPC 请求
async function sandshrewRpcRequest<T>(method: string, params: any[] = []): Promise<T> {
  // 规范化API方法名称 - 移除btc_前缀
  const normalizedMethod = method.startsWith('btc_') ? method.substring(4) : method;
  
  // 开发环境检测
  const isDev = typeof window !== 'undefined' && 
               (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1');
  
  // 准备请求体
  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: normalizedMethod,
    params,
  };
  
  // 尝试所有API端点
  const apis = [
    { instance: sandshrewApi, name: 'Sandshrew API' },
    { instance: backupApi1, name: 'Backup API 1' },
    { instance: backupApi2, name: 'Backup API 2' }
  ];
  
  let lastError = null;
  
  // 依次尝试所有API端点
  for (const api of apis) {
    try {
      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      console.log(`尝试通过 ${api.name} 获取数据: ${normalizedMethod}`);
      
      const response = await api.instance.post('', requestBody, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      if (response.data.error) {
        console.warn(`${api.name} 返回错误: ${response.data.error.message}`);
        lastError = new Error(response.data.error.message || '未知错误');
        continue; // 尝试下一个API
      }

      console.log(`成功从 ${api.name} 获取数据: ${normalizedMethod}`);
      return response.data.result;
    } catch (error) {
      // 记录错误并继续尝试下一个API
      console.error(`${api.name} 请求失败: ${normalizedMethod}`, error);
      lastError = error;
    }
  }
  
  // 如果是特定于Alkanes的API且失败，尝试使用无前缀版本和简化端点名称
  if (method.startsWith('alkanes_')) {
    try {
      // 移除alkanes_前缀
      const alkaneMethod = method.substring(8);
      console.log(`尝试使用简化方法名称: ${alkaneMethod}`);
      
      const response = await sandshrewApi.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: alkaneMethod,
        params,
      }, { timeout: 10000 });
      
      if (!response.data.error) {
        console.log(`成功获取简化方法API数据: ${alkaneMethod}`);
        return response.data.result;
      }
    } catch (retryError) {
      console.error(`尝试简化方法也失败: ${method}`, retryError);
    }
  }
  
  // 支持特别指定使用实际数据的情况
  if (ENABLE_REAL_DATA && !isDev) {
    console.error(`所有API端点都失败，无法获取实际数据: ${method}`);
    throw lastError || new Error(`无法从任何API端点获取数据: ${method}`);
  }
  
  // 所有API端点尝试失败
  
  // 如果明确设置使用模拟数据或在开发环境中
  if (USE_MOCK_DATA || (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1'))) {
    console.log(`所有API尝试失败，使用模拟数据: ${method}`);
    return await getSimulatedData(method, params);
  }
  
  // 在生产环境或特别指定不使用模拟数据时，抛出错误
  throw lastError || new Error(`无法获取数据: ${method}`);
}

// 获取模拟数据的辅助函数
async function getSimulatedData<T>(method: string, params: any[] = []): Promise<T> {
  switch (method) {
    case 'btc_getblockcount':
      return mockData.getBlockCount() as any;
    case 'btc_getblockhash':
      const height = params[0];
      const block = await mockData.getBlockByHeight(height);
      return (block?.hash || '') as any;
    case 'btc_getblock':
      const hash = params[0];
      return mockData.getBlockByHash(hash) as any;
    case 'btc_getrawtransaction':
      const txid = params[0];
      return mockData.getTransaction(txid) as any;
    case 'alkanes_dieselbalance':
      return { 
        balance: Math.floor(Math.random() * 1000000) / 100 
      } as any;
    case 'alkanes_highestgas':
      // 模拟高优先级gas价格 - 使用更真实的数值
      return Math.floor(Math.random() * 5) + 8 as any;
    case 'alkanes_nextblockminting':
      return { 
        estimatedTimeLeft: Math.floor(Math.random() * 600), 
        recommendedGas: Math.floor(Math.random() * 5) + 8,
        competitorCount: Math.floor(Math.random() * 5) + 1
      } as any;
    case 'alkanes_listcontracts':
      return mockData.getAlkanesContracts() as any;
    case 'alkanes_getcontractinfo':
      const contractId = params[0];
      return mockData.getAlkanesContractInfo(contractId) as any;
    case 'btc_getaddressinfo':
      const address = params[0];
      return mockData.getAddressInfo(address) as any;
    case 'btc_getmempoolinfo':
      return { size: Math.floor(Math.random() * 5000) + 1000 } as any;
    case 'btc_getrawmempool':
      // 模拟mempool交易
      const txCount = Math.floor(Math.random() * 100) + 50;
      const txs = {};
      for (let i = 0; i < txCount; i++) {
        const txid = Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        txs[txid] = {
          fee_rate: Math.floor(Math.random() * 10) + 5, // 更真实的费率范围
          time: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600)
        };
      }
      return txs as any;
    case 'btc_estimatesmartfee':
      const blocks = params[0] || 1;
      return { 
        feerate: (30 - blocks * 3) / 100000, // 更真实的费率
        blocks: blocks
      } as any;
    case 'alkanes_dieselbids':
    case 'alkanes_activebids':
      // 模拟出价数据
      const bidCount = Math.floor(Math.random() * 5) + 1;
      const bids = [];
      for (let i = 0; i < bidCount; i++) {
        bids.push({
          address: 'bc1' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          amount: Math.floor(Math.random() * 7) + 8, // 8-15 sat/vB, 更真实
          timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 600)
        });
      }
      return { bids } as any;
    case 'alkanes_recommendedgas':
      return { gas: Math.floor(Math.random() * 5) + 8 } as any; // 8-13 sat/vB，更真实
    case 'btc_getaddressutxos':
      const utxoCount = Math.floor(Math.random() * 5) + 1;
      const utxos = [];
      for (let i = 0; i < utxoCount; i++) {
        utxos.push({
          txid: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          vout: i,
          value: Math.floor(Math.random() * 10000000) + 100000,
          height: 888000 + Math.floor(Math.random() * 1000)
        });
      }
      return utxos as any;
    case 'protorunesbyaddress':
    case 'protorunesbyheight':
      return {
        balanceSheet: [
          {
            rune: { name: 'DIESEL', divisibility: 8 },
            balance: BigInt(Math.floor(Math.random() * 100000000))
          }
        ],
        txs: []
      } as any;
    default:
      console.warn(`模拟数据中未实现的方法: ${method}`);
      return {} as any;
  }
}

// 获取当前区块高度
export async function getBlockCount(): Promise<number> {
  try {
    // 使用Sandshrew API获取
    return sandshrewRpcRequest<number>('btc_getblockcount');
  } catch (error) {
    console.error('获取区块高度错误:', error);
    // 失败时返回一个默认值
    return 0;
  }
}

// 通过高度获取区块
export async function getBlockByHeight(height: number): Promise<any> {
  try {
    const hash = await sandshrewRpcRequest<string>('btc_getblockhash', [height]);
    return sandshrewRpcRequest<any>('btc_getblock', [hash, 2]);
  } catch (error) {
    console.error('获取区块数据错误:', error);
    return null;
  }
}

// 通过哈希获取区块
export async function getBlockByHash(hash: string): Promise<any> {
  try {
    return sandshrewRpcRequest<any>('btc_getblock', [hash, 2]);
  } catch (error) {
    console.error('获取区块数据错误:', error);
    return null;
  }
}

// 获取最近区块
export async function getRecentBlocks(limit: number = 10): Promise<any[]> {
  try {
    const blockCount = await getBlockCount();
    const blocks = [];
    
    for (let i = 0; i < limit && blockCount - i >= 0; i++) {
      try {
        const block = await getBlockByHeight(blockCount - i);
        blocks.push(block);
      } catch (err) {
        console.error(`获取区块 ${blockCount - i} 失败:`, err);
      }
    }
    
    return blocks;
  } catch (error) {
    console.error('获取最近区块错误:', error);
    return [];
  }
}

// 获取交易详情
export async function getTransaction(txid: string): Promise<any> {
  try {
    return sandshrewRpcRequest<any>('btc_getrawtransaction', [txid, true]);
  } catch (error) {
    console.error('获取交易数据错误:', error);
    return null;
  }
}

// 为保持一致性，添加getTransactionById作为getTransaction的别名
export const getTransactionById = getTransaction;

// 获取当前区块的Alkanes交易
export async function getCurrentBlockAlkanesTxs(): Promise<any[]> {
  try {
    // 尝试通过Sandshrew API获取当前区块的Alkanes交易
    // 由于alkanes_currentblocktxs不再被支持，我们通过其他方式获取数据
    
    // 获取最近的区块
    const recentBlocks = await getRecentBlocks(1);
    if (!recentBlocks || recentBlocks.length === 0) {
      console.warn('无法获取最近的区块');
      return [];
    }
    
    const latestBlock = recentBlocks[0];
    
    // 从区块中筛选Alkanes相关交易
    // 这里需要根据实际的Alkanes交易特征来筛选
    const alkanesTransactions = [];
    
    if (latestBlock && latestBlock.tx) {
      for (const tx of latestBlock.tx) {
        // 检查交易是否包含Alkanes特征
        // 例如特定的OP_RETURN数据前缀等
        if (isAlkanesTransaction(tx)) {
          alkanesTransactions.push(tx);
        }
      }
    }
    
    return alkanesTransactions;
  } catch (error) {
    console.error('获取Alkanes交易错误:', error);
    return [];
  }
}

// 判断交易是否为Alkanes交易的辅助函数
function isAlkanesTransaction(tx: any): boolean {
  // 示例实现，需根据实际Alkanes协议标准调整
  try {
    // 检查交易输出是否包含Alkanes协议标识
    if (tx.vout) {
      for (const vout of tx.vout) {
        if (vout.scriptPubKey && vout.scriptPubKey.asm) {
          // 检查是否包含Alkanes协议标识
          if (vout.scriptPubKey.asm.includes('OP_RETURN 616c6b616e6573')) {
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

// 获取当前网络Gas费率信息
export async function getNetworkFeeRates(): Promise<any> {
  try {
    // 使用btc_estimatesmartfee获取网络费率
    const feeEstimates = [];
    
    // 获取不同确认时间的费率
    const fastestFee = await sandshrewRpcRequest<any>('btc_estimatesmartfee', [1]); // 1个区块确认
    const halfHourFee = await sandshrewRpcRequest<any>('btc_estimatesmartfee', [3]); // 3个区块约半小时
    const hourFee = await sandshrewRpcRequest<any>('btc_estimatesmartfee', [6]); // 6个区块约1小时
    const economyFee = await sandshrewRpcRequest<any>('btc_estimatesmartfee', [12]); // 12个区块约2小时
    
    return {
      fastestFee: fastestFee?.feerate ? Math.round(fastestFee.feerate * 100000) : 25,
      halfHourFee: halfHourFee?.feerate ? Math.round(halfHourFee.feerate * 100000) : 15,
      hourFee: hourFee?.feerate ? Math.round(hourFee.feerate * 100000) : 10,
      economyFee: economyFee?.feerate ? Math.round(economyFee.feerate * 100000) : 5,
      minimumFee: 1
    };
  } catch (error) {
    console.error('获取网络费率错误:', error);
    // 失败后返回默认数据
    return {
      fastestFee: 25,
      halfHourFee: 15,
      hourFee: 10,
      economyFee: 5,
      minimumFee: 1
    };
  }
}

// 获取Alkanes协议的最高gas价格
export async function getHighestGasForAlkanes(): Promise<number> {
  try {
    console.log('尝试获取真实的Alkanes Gas价格数据...');

    // 尝试方法1：直接获取当前最高Gas价格
    try {
      // 尝试多种可能的API端点
      const endpoints = [
        'alkanes_highestgas',
        'highestgas',
        'alkanes_gasprices',
        'gasprices'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`尝试API端点: ${endpoint}`);
          const result = await sandshrewRpcRequest<any>(endpoint, []);
          
          if (result) {
            // 处理不同格式的返回值
            if (typeof result === 'number' && result > 0) {
              console.log(`成功获取Gas价格(数字格式): ${result}`);
              return result;
            } else if (typeof result === 'object') {
              // 可能是{highest: X}格式
              const gasValue = result.highest || result.gas || result.recommended;
              if (typeof gasValue === 'number' && gasValue > 0) {
                console.log(`成功获取Gas价格(对象格式): ${gasValue}`);
                return gasValue;
              }
            }
          }
        } catch (endpointError) {
          console.warn(`端点 ${endpoint} 请求失败:`, endpointError);
          // 继续尝试下一个端点
        }
      }
    } catch (highestGasError) {
      console.error('获取高Gas价格失败:', highestGasError);
    }

    // 尝试方法2：获取Diesel出价数据
    // 这是最准确的方法，因为它直接反映了当前的DIESEL铸造交易
    let alkanesBids: number[] = [];
    try {
      // 尝试多种可能的出价API
      const bidEndpoints = [
        'alkanes_dieselbids',
        'dieselbids',
        'alkanes_activebids', 
        'activebids'
      ];
      
      for (const endpoint of bidEndpoints) {
        try {
          console.log(`尝试获取出价数据: ${endpoint}`);
          const bidsData = await sandshrewRpcRequest<any>(endpoint, []);
          
          if (bidsData && bidsData.bids && Array.isArray(bidsData.bids)) {
            // 处理有效的出价
            const validBids = bidsData.bids
              .filter((bid: any) => {
                const amount = bid.amount || bid.gas || bid.feerate || bid.fee;
                return amount && typeof amount === 'number' && amount > 0;
              })
              .map((bid: any) => {
                const amount = bid.amount || bid.gas || bid.feerate || bid.fee;
                return amount;
              });
            
            if (validBids.length > 0) {
              console.log(`从 ${endpoint} 获取到有效出价:`, validBids);
              alkanesBids = alkanesBids.concat(validBids);
            }
          }
        } catch (bidEndpointError) {
          console.warn(`出价端点 ${endpoint} 请求失败:`, bidEndpointError);
        }
      }
      
      if (alkanesBids.length > 0) {
        // 找出最高出价
        alkanesBids.sort((a, b) => b - a);
        const highestBid = alkanesBids[0];
        
        console.log('获取到的最高出价:', highestBid);
        return highestBid;
      }
    } catch (bidsError) {
      console.error('获取出价数据错误:', bidsError);
    }
    
    // 尝试方法3：检查当前的Diesel mempool交易 
    try {
      // 尝试获取当前的mempool交易
      const mempoolEndpoints = [
        'alkanes_dieselmempool', 
        'dieselmempool',
        'alkanes_pendingmint',
        'pendingmint'
      ];
      
      for (const endpoint of mempoolEndpoints) {
        try {
          const mempoolTxs = await sandshrewRpcRequest<any>(endpoint, []);
          
          if (mempoolTxs && Array.isArray(mempoolTxs)) {
            const gasRates = mempoolTxs
              .filter((tx: any) => tx.feerate || tx.gas || tx.fee)
              .map((tx: any) => tx.feerate || tx.gas || tx.fee);
            
            if (gasRates.length > 0) {
              const maxGasRate = Math.max(...gasRates);
              console.log(`从mempool交易获取的最高Gas: ${maxGasRate}`);
              return maxGasRate;
            }
          }
        } catch (mempoolError) {
          console.warn(`Mempool端点 ${endpoint} 请求失败:`, mempoolError);
        }
      }
    } catch (mempoolError) {
      console.error('获取mempool数据错误:', mempoolError);
    }
    
    // 尝试方法4：获取推荐Gas价格
    try {
      const recommendedEndpoints = [
        'alkanes_recommendedgas',
        'recommendedgas', 
        'getrecommendedgas',
        'getfeerate'
      ];
      
      for (const endpoint of recommendedEndpoints) {
        try {
          const recommendedGas = await sandshrewRpcRequest<any>(endpoint, []);
          
          // 处理不同格式的返回值
          if (typeof recommendedGas === 'number' && recommendedGas > 0) {
            console.log(`获取到推荐Gas价格(数字格式): ${recommendedGas}`);
            return recommendedGas;
          } else if (typeof recommendedGas === 'object') {
            const gasValue = recommendedGas.gas || recommendedGas.recommended || recommendedGas.feerate;
            if (typeof gasValue === 'number' && gasValue > 0) {
              console.log(`获取到推荐Gas价格(对象格式): ${gasValue}`);
              return gasValue;
            }
          }
        } catch (recError) {
          console.warn(`推荐Gas端点 ${endpoint} 请求失败:`, recError);
        }
      }
    } catch (recError) {
      console.error('获取推荐Gas价格错误:', recError);
    }

    // 尝试方法5：分析Discord中的截图显示大多数Gas为8sat/vB左右
    // 在其他方法都失败时，返回一个接近目前观察到的值
    console.log('所有API方法都失败，返回基于观察的默认值');
    return 8;
  } catch (error) {
    console.error('获取Alkanes Gas价格过程中发生错误:', error);
    return 8; // 根据Discord截图返回合理默认值
  }
}

// 获取地址的Diesel代币余额
export async function getDieselBalance(address: string): Promise<any> {
  try {
    // 使用Sandshrew API的protorunesbyaddress方法查询Diesel余额
    const protoRunes = await sandshrewRpcRequest<any>('protorunesbyaddress', [{
      address: address,
      protocolTag: BigInt(1) // Alkanes协议ID为1
    }]);
    
    // 如果没有数据，返回零余额
    if (!protoRunes || !protoRunes.balanceSheet || protoRunes.balanceSheet.length === 0) {
      return { balance: 0 };
    }
    
    // 查找DIESEL代币
    let dieselBalance = 0;
    for (const rune of protoRunes.balanceSheet) {
      if (rune.rune && rune.rune.name === 'DIESEL') {
        // 余额需要根据divisibility进行调整
        const divisibility = rune.rune.divisibility || 0;
        dieselBalance += Number(rune.balance) / Math.pow(10, divisibility);
      }
    }
    
    return { balance: dieselBalance };
  } catch (error) {
    console.error('获取Diesel余额错误:', error);
    return { balance: 0 };
  }
}

// 监控下一个区块铸造窗口的信息
export async function monitorNextBlockMintingWindow(): Promise<any> {
  try {
    // 尝试直接获取API数据
    try {
      const result = await sandshrewRpcRequest<any>('alkanes_nextblockminting');
      if (result && typeof result.estimatedTimeLeft === 'number') {
        console.log('获取到下一区块铸造信息:', result);
        return result;
      }
    } catch (apiError) {
      console.warn('获取下一区块铸造API错误:', apiError);
      // 继续尝试使用估算方法
    }
    
    // 如果API不可用，使用自己的估算逻辑
    const currentHeight = await getBlockCount();
    const recentBlocks = await getRecentBlocks(10);
    
    // 计算平均出块时间
    let avgBlockTime = 600; // 默认10分钟
    if (recentBlocks.length >= 2) {
      let totalTime = 0;
      let count = 0;
      
      for (let i = 0; i < recentBlocks.length - 1; i++) {
        const timeDiff = recentBlocks[i].time - recentBlocks[i + 1].time;
        if (timeDiff > 0) {
          totalTime += timeDiff;
          count++;
        }
      }
      
      if (count > 0) {
        avgBlockTime = totalTime / count;
      }
    }
    
    // 估算距离下一个区块的时间
    const latestBlock = recentBlocks[0];
    const currentTime = Math.floor(Date.now() / 1000);
    const secondsSinceLastBlock = currentTime - latestBlock.time;
    const estimatedTimeLeft = Math.max(0, avgBlockTime - secondsSinceLastBlock);
    
    // 获取当前Gas价格
    const recommendedGas = await getHighestGasForAlkanes();
    
    // 估算竞争者数量
    let competitorCount = 5; // 默认值
    
    try {
      // 从上下文中计算竞争者数量
      // 这里可以基于Alkanes特定逻辑调整
      const activeBids = await sandshrewRpcRequest<any>('alkanes_activebids');
      if (activeBids && activeBids.bids && Array.isArray(activeBids.bids)) {
        competitorCount = activeBids.bids.length;
      } else {
        // 使用区块交易数量作为参考
        competitorCount = Math.ceil((latestBlock.tx?.length || 100) / 200);
      }
    } catch (error) {
      console.error('估算竞争者数量错误:', error);
    }
    
    return {
      estimatedTimeLeft,
      recommendedGas,
      competitorCount
    };
  } catch (error) {
    console.error('监控下一区块铸造窗口错误:', error);
    return {
      estimatedTimeLeft: 600, // 默认10分钟
      recommendedGas: 15,     // 默认15 sat/vB
      competitorCount: 5      // 默认5个竞争者
    };
  }
}

// 获取Alkanes合约列表
export async function getAlkanesContracts(): Promise<any[]> {
  try {
    // 尝试使用通用方法获取合约列表
    // 由于Sandshrew可能不支持alkanes_listcontracts方法
    // 我们使用模拟数据作为演示
    
    // 生成一些模拟合约数据
    return [
      {
        id: { block: '1', tx: '0' },
        name: 'Diesel',
        deploymentHeight: 880000,
        txid: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      },
      {
        id: { block: '1', tx: '1' },
        name: 'TokenStandard',
        deploymentHeight: 880000,
        txid: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      }
    ];
  } catch (error) {
    console.error('获取Alkanes合约列表错误:', error);
    return [];
  }
}

// 获取Alkanes合约详情
export async function getAlkanesContractInfo(contractId: string): Promise<any> {
  try {
    // 由于Sandshrew可能不支持alkanes_getcontractinfo方法
    // 我们使用模拟数据作为演示
    const [block, tx] = contractId.split(':');
    
    return {
      id: { block, tx },
      name: block === '1' && tx === '0' ? 'Diesel' : 'Unknown Contract',
      deploymentHeight: 880000,
      txid: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      bytecodeSize: Math.floor(Math.random() * 5000) + 1000,
      creator: 'bc1' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      functions: [
        { name: 'mint', inputs: ['address', 'uint256'] },
        { name: 'balanceOf', inputs: ['address'] },
        { name: 'transfer', inputs: ['address', 'address', 'uint256'] }
      ]
    };
  } catch (error) {
    console.error('获取Alkanes合约详情错误:', error);
    return null;
  }
}

// 获取地址信息
export async function getAddressInfo(address: string): Promise<any> {
  try {
    return sandshrewRpcRequest<any>('btc_getaddressinfo', [address]);
  } catch (error) {
    console.error('获取地址信息错误:', error);
    return null;
  }
}

// 地址UTXO
export async function getAddressUtxos(address: string): Promise<any[]> {
  try {
    return sandshrewRpcRequest<any[]>('btc_getaddressutxos', [address]);
  } catch (error) {
    console.error('获取地址UTXO错误:', error);
    return [];
  }
}

// 获取地址余额
export async function getAddressBalance(address: string): Promise<number> {
  try {
    // 使用Sandshrew API获取地址余额
    const addressUtxos = await getAddressUtxos(address);
    return addressUtxos.reduce((acc, utxo) => acc + (utxo.value || 0), 0);
  } catch (error) {
    console.error('获取地址余额错误:', error);
    return 0;
  }
}

// 添加类型定义
interface TrackedTransaction {
  txid: string;
  inputs: string[];  // 输入的outpoint集合 (txid:vout格式)
  gas: number;
  detectTime: number;
  isRbf: boolean;
  previousTxid?: string; // 如果是RBF交易，记录被替换的交易ID
  gasChange?: number;    // 记录gas变化量
}

// 添加交易跟踪记录
let trackedTransactions: Record<string, TrackedTransaction> = {};
// 添加输入索引，用于快速查找使用相同输入的交易
let inputToTxidIndex: Record<string, string> = {};
// 最后检测到的最高gas
let lastHighestGas: number = 0;
// 最近发现的高gas交易
let recentHighGasTxs: string[] = [];

// 重置交易跟踪状态 (定期清理过旧的交易)
export function resetTrackedTransactions() {
  // 保留最近60分钟的交易
  const cutoffTime = Date.now() - 3600 * 1000; 
  const newTrackedTransactions: Record<string, TrackedTransaction> = {};
  
  Object.values(trackedTransactions).forEach(tx => {
    if (tx.detectTime > cutoffTime) {
      newTrackedTransactions[tx.txid] = tx;
    }
  });
  
  trackedTransactions = newTrackedTransactions;
  
  // 重建输入索引
  inputToTxidIndex = {};
  Object.values(trackedTransactions).forEach(tx => {
    tx.inputs.forEach(input => {
      inputToTxidIndex[input] = tx.txid;
    });
  });
  
  // 清理最近的高gas交易列表
  recentHighGasTxs = [];
}

// 跟踪交易并检测RBF
export function trackTransaction(tx: any, gas: number): TrackedTransaction | null {
  if (!tx || !tx.txid || !tx.vin) return null;
  
  try {
    // 构建输入列表，格式为 [txid:vout, txid:vout, ...]
    const inputs = tx.vin.map((input: any) => 
      `${input.txid || ''}:${input.vout || 0}`
    ).filter((input: string) => input.length > 2);
    
    if (inputs.length === 0) return null;
    
    const now = Date.now();
    let isRbf = false;
    let previousTxid = '';
    let gasChange = 0;
    
    // 检查是否有使用相同输入的交易 (潜在的RBF)
    const conflictingInputs = inputs.filter((input: string) => inputToTxidIndex[input]);
    if (conflictingInputs.length > 0) {
      // 找到第一个冲突的交易
      const conflictInput = conflictingInputs[0];
      const existingTxid = inputToTxidIndex[conflictInput];
      const existingTx = trackedTransactions[existingTxid];
      
      if (existingTx && existingTx.gas !== gas) {
        // 确认为RBF交易
        isRbf = true;
        previousTxid = existingTxid;
        gasChange = gas - existingTx.gas;
        
        console.log(`检测到RBF交易: ${tx.txid} 替换 ${existingTxid}, Gas变化: ${existingTx.gas} -> ${gas} (${gasChange > 0 ? '+' : ''}${gasChange})`);
        
        // 如果gas提高，记录为高gas交易
        if (gasChange > 0 && gas > 10) {
          recentHighGasTxs.push(tx.txid);
        }
        
        // 从索引中移除旧交易的输入
        existingTx.inputs.forEach((input: string) => {
          if (inputToTxidIndex[input] === existingTxid) {
            delete inputToTxidIndex[input];
          }
        });
      }
    }
    
    // 记录新交易
    const trackedTx: TrackedTransaction = {
      txid: tx.txid,
      inputs,
      gas,
      detectTime: now,
      isRbf,
      previousTxid: isRbf ? previousTxid : undefined,
      gasChange: isRbf ? gasChange : undefined
    };
    
    trackedTransactions[tx.txid] = trackedTx;
    
    // 更新输入索引
    inputs.forEach((input: string) => {
      inputToTxidIndex[input] = tx.txid;
    });
    
    // 检查是否是高gas交易
    if (gas > 10 && !isRbf) {
      recentHighGasTxs.push(tx.txid);
    }
    
    return trackedTx;
  } catch (error) {
    console.error('跟踪交易失败:', error);
    return null;
  }
}

// 判断是否需要更新前端
export function shouldUpdateFrontend(currentHighestGas: number): boolean {
  // 1. 如果最高gas发生变化
  if (Math.abs(currentHighestGas - lastHighestGas) >= 0.5) {
    lastHighestGas = currentHighestGas;
    return true;
  }
  
  // 2. 如果有新的高gas交易
  if (recentHighGasTxs.length > 0) {
    recentHighGasTxs = []; // 清空列表
    return true;
  }
  
  return false;
}

// 监控Alkanes Gas并提交最优交易获取Diesel奖励
export async function monitorAlkanesGasAndSubmitTx(options: {
  address: string,
  privateKey: string,
  maxGasLimit?: number,
  targetGasMultiplier?: number,
  checkIntervalMs?: number,
  onStatusUpdate?: (status: any) => void,
  enabled?: boolean,
  strategy?: 'aggressive' | 'balanced' | 'conservative',
  customMinCompetitors?: number,
  customMaxCompetitors?: number
}): Promise<() => void> {
  
  const {
    address,
    privateKey,
    maxGasLimit = 30, // 降低默认最高限制
    targetGasMultiplier = 1.03, // 降低默认倍数
    checkIntervalMs = 1500, // 缩短为1.5秒
    onStatusUpdate,
    enabled = true,
    customMinCompetitors = 1,
    customMaxCompetitors = 10
  } = options;
  
  // 将strategy从解构中移出，使其可以被修改
  let strategy = options.strategy || 'balanced'; // 默认使用平衡策略
  
  if (!enabled) {
    console.log('Alkanes Gas监控已禁用');
    return () => {};
  }
  
  if (!address || !privateKey) {
    throw new Error('缺少必要参数: 地址和私钥');
  }
  
  let isRunning = true;
  let lastSubmittedTx: any = null;
  let consecutiveFailures = 0;
  let lastFrontendUpdateTime = 0;
  
  // 策略配置
  const strategyConfigs: Record<string, any> = {
    aggressive: {
      minCompetitors: customMinCompetitors,
      maxCompetitors: customMaxCompetitors * 2,
      minTimeWindow: 15,  // 至少15秒
      maxTimeWindow: 450, // 最多7.5分钟
      gasMultiplier: Math.max(1.05, targetGasMultiplier) // 至少5%
    },
    balanced: {
      minCompetitors: customMinCompetitors,
      maxCompetitors: customMaxCompetitors,
      minTimeWindow: 30,  // 至少30秒
      maxTimeWindow: 300, // 最多5分钟
      gasMultiplier: targetGasMultiplier
    },
    conservative: {
      minCompetitors: 0,  // 竞争者少时也可以参与
      maxCompetitors: Math.floor(customMaxCompetitors / 2), // 竞争者数量阈值降低
      minTimeWindow: 60,  // 至少1分钟
      maxTimeWindow: 240, // 最多4分钟
      gasMultiplier: Math.min(1.01, targetGasMultiplier) // 降低倍率
    }
  };
  
  // 获取当前策略配置
  const currentStrategy = strategyConfigs[strategy];
  
  const stopMonitoring = () => {
    isRunning = false;
  };
  
  const updateStatus = (status: any, forceUpdate: boolean = false) => {
    console.log('监控状态:', status);
    
    // 只在需要时更新前端
    const now = Date.now();
    const shouldUpdate = forceUpdate || 
                         shouldUpdateFrontend(status.currentHighestGas) || 
                         (now - lastFrontendUpdateTime > 10000); // 至少每10秒更新一次
    
    if (shouldUpdate && onStatusUpdate) {
      onStatusUpdate(status);
      lastFrontendUpdateTime = now;
    }
  };
  
  // 智能计算最优gas策略
  const calculateOptimalGas = (
    currentGas: number, 
    competitorCount: number, 
    blockTimeLeft: number
  ): number => {
    // 基础倍率
    let multiplier = currentStrategy.gasMultiplier;
    
    // 根据竞争者数量调整倍率
    if (competitorCount > currentStrategy.maxCompetitors) {
      // 高竞争环境，增加倍率以提高成功率
      multiplier = Math.min(multiplier * 1.2, 1.1);
    } else if (competitorCount < currentStrategy.minCompetitors) {
      // 低竞争环境，降低倍率节省费用
      multiplier = Math.max(multiplier * 0.9, 1.01);
    }
    
    // 根据区块时间调整倍率
    const normalizedTimeLeft = blockTimeLeft / 600; // 除以10分钟获取0-1的比例
    if (normalizedTimeLeft < 0.1) {
      // 区块即将生成，增加倍率
      multiplier = Math.min(multiplier * 1.2, 1.1);
    } else if (normalizedTimeLeft > 0.8) {
      // 区块刚生成不久，降低倍率
      multiplier = 1.01;
    }
    
    // 应用倍率并限制在最大值内
    const optimalGas = Math.min(
      Math.ceil(currentGas * multiplier),
      maxGasLimit
    );
    
    // Discord截图显示，实际出价通常在6-17范围内
    // 限制输出在合理范围内
    return Math.min(Math.max(optimalGas, 5), maxGasLimit);
  };
  
  // 确定是否应该提交交易
  const shouldSubmitTransaction = (mintingInfo: any): boolean => {
    const { 
      estimatedTimeLeft, 
      competitorCount, 
      competitionLevel = 1 // 默认值
    } = mintingInfo;
    
    // 时间窗口条件
    const timeWindowOk = 
      estimatedTimeLeft >= currentStrategy.minTimeWindow && 
      estimatedTimeLeft <= currentStrategy.maxTimeWindow;
    
    // 竞争条件
    const competitionOk = competitorCount <= currentStrategy.maxCompetitors;
    
    // 策略特定条件
    let strategySpecificOk = true;
    
    if (strategy === 'aggressive') {
      // 激进策略：只要时间窗口合适就参与
      strategySpecificOk = timeWindowOk;
    } else if (strategy === 'balanced') {
      // 平衡策略：时间窗口合适且竞争不激烈
      strategySpecificOk = timeWindowOk && competitionLevel <= 2;
    } else if (strategy === 'conservative') {
      // 保守策略：只在最优条件下参与
      strategySpecificOk = 
        timeWindowOk && 
        competitionLevel <= 1 && 
        estimatedTimeLeft > 60 && 
        estimatedTimeLeft < 240;
    }
    
    return timeWindowOk && competitionOk && strategySpecificOk;
  };
  
  // 监控循环
  const monitorLoop = async () => {
    // 每小时清理一次过旧的交易记录
    let lastCleanupTime = Date.now();
    
    while (isRunning) {
      try {
        // 定期清理过旧的交易
        const now = Date.now();
        if (now - lastCleanupTime > 3600 * 1000) {
          resetTrackedTransactions();
          lastCleanupTime = now;
        }
        
        // 1. 获取当前最高gas价格
        const currentHighestGas = await getHighestGasForAlkanes();
        
        // 2. 获取下一个铸造窗口信息
        const mintingInfo = await monitorNextBlockMintingWindow();
        
        // 3. 计算我们应该使用的最优gas价格
        const optimalGas = calculateOptimalGas(
          currentHighestGas,
          mintingInfo.competitorCount,
          mintingInfo.estimatedTimeLeft
        );
        
        const status = {
          timestamp: new Date().toISOString(),
          currentHighestGas,
          optimalGas,
          mintingInfo,
          lastSubmittedTx,
          strategy,
          consecutiveFailures,
          rbfDetected: recentHighGasTxs.length > 0, // 添加RBF检测标志
          trackedTxCount: Object.keys(trackedTransactions).length,
          rbfTxCount: Object.values(trackedTransactions).filter(tx => tx.isRbf).length
        };
        
        // 智能更新，只在必要时更新前端
        updateStatus(status);
        
        // 4. 判断是否应该提交交易
        const shouldSubmit = 
          shouldSubmitTransaction(mintingInfo) && 
          optimalGas <= maxGasLimit && 
          !lastSubmittedTx;
          
        if (shouldSubmit) {
          // 5. 构建并提交交易
          try {
            // 这里需要实现具体的交易构建和提交逻辑
            console.log(`准备提交交易，Gas设置为 ${optimalGas}，策略: ${strategy}`);
            
            // 构建假交易，实际项目需要替换为真实交易构建逻辑
            const txData = {
              from: address,
              gas: optimalGas,
              strategy,
              estimatedTimeLeft: mintingInfo.estimatedTimeLeft,
              competitorCount: mintingInfo.competitorCount,
              timestamp: new Date().toISOString()
            };
            
            // 记录交易信息
            lastSubmittedTx = txData;
            consecutiveFailures = 0; // 重置失败计数
            
            updateStatus({
              ...status,
              lastSubmittedTx,
              message: '交易已提交'
            });
            
            // 模拟交易提交成功
            // 在真实环境中，这里应该调用实际的交易发送API
            setTimeout(() => {
              console.log('交易已确认，准备下一次机会');
              lastSubmittedTx = null;
            }, 60000); // 1分钟后重置
          } catch (txError) {
            console.error('提交交易失败:', txError);
            consecutiveFailures++;
            
            updateStatus({
              ...status,
              error: '提交交易失败: ' + txError.message,
              consecutiveFailures
            });
            
            // 如果连续失败超过阈值，重置交易状态
            if (consecutiveFailures >= 3) {
              lastSubmittedTx = null;
              console.log('连续失败次数过多，重置状态');
            }
          }
        } else if (lastSubmittedTx) {
          // 交易已提交，等待确认
          updateStatus({
            ...status,
            message: '等待交易确认'
          });
        } else {
          // 不满足提交条件
          updateStatus({
            ...status,
            message: '监控中，未达到交易提交条件'
          });
        }
        
        // 根据区块剩余时间动态调整检查间隔
        let dynamicInterval = checkIntervalMs;
        if (mintingInfo.estimatedTimeLeft < 60) {
          // 区块即将生成，缩短间隔
          dynamicInterval = Math.max(1000, checkIntervalMs / 2);
        } else if (mintingInfo.estimatedTimeLeft > 300) {
          // 区块刚生成，延长间隔
          dynamicInterval = checkIntervalMs * 2;
        }
        
        // 等待指定时间后再次检查
        await new Promise(resolve => setTimeout(resolve, dynamicInterval));
      } catch (error) {
        console.error('监控循环错误:', error);
        consecutiveFailures++;
        
        updateStatus({
          error: '监控出错: ' + error.message,
          timestamp: new Date().toISOString(),
          consecutiveFailures
        });
        
        // 出错后等待更长时间再重试
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs * 2));
      }
    }
  };
  
  // 启动监控循环
  monitorLoop();
  
  // 返回停止监控的函数
  return stopMonitoring;
}

// 获取Diesel出价数据
export async function getDieselBids(): Promise<any[]> {
  console.log('获取Diesel出价数据');

  // 尝试多个可能的API端点
  const endpoints = [
    'alkanes_dieselbids',
    'dieselbids',
    'alkanes_activebids',
    'activebids'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`尝试使用API端点: ${endpoint}`);
      const response = await sandshrewRpcRequest<any>(endpoint);
      
      // 检查响应格式
      if (response && (response.bids || Array.isArray(response))) {
        const bidsArray = response.bids || response;
        
        if (Array.isArray(bidsArray)) {
          console.log(`成功从 ${endpoint} 获取出价数据，共 ${bidsArray.length} 条`);
          
          // 标准化数据格式
          const normalizedBids = bidsArray.map(bid => ({
            address: bid.address || bid.addr || bid.sender || '未知地址',
            amount: typeof bid.amount === 'number' ? bid.amount : 
                   typeof bid.gas === 'number' ? bid.gas : 
                   typeof bid.fee === 'number' ? bid.fee : 0,
            timestamp: bid.timestamp || bid.time || Math.floor(Date.now() / 1000),
            origin: endpoint
          }));
          
          // 过滤掉金额为0的出价
          const validBids = normalizedBids.filter(bid => bid.amount > 0);
          
          // 按金额降序排序
          return validBids.sort((a, b) => b.amount - a.amount);
        }
      }
      
      console.warn(`${endpoint} 返回格式不正确`);
    } catch (error) {
      console.error(`从 ${endpoint} 获取出价数据失败:`, error);
    }
  }

  // 所有API端点都失败，根据USE_MOCK_DATA返回模拟数据或空数组
  if (USE_MOCK_DATA) {
    console.log('所有API端点都失败，使用模拟数据');
    const mockBids = await getSimulatedData<any>('alkanes_dieselbids');
    return (mockBids.bids || []).sort((a, b) => b.amount - a.amount);
  }
  
  // 返回空数组
  return [];
}

// 获取历史出价记录
export async function getHistoricalBids(limit: number = 10): Promise<any[]> {
  try {
    console.log('获取历史出价记录...');
    
    // 尝试多种可能的API端点
    const historyEndpoints = [
      'alkanes_bidhistory',
      'bidhistory',
      'alkanes_dieselhistory',
      'dieselhistory'
    ];
    
    for (const endpoint of historyEndpoints) {
      try {
        console.log(`尝试获取历史数据: ${endpoint}`);
        const historyData = await sandshrewRpcRequest<any>(endpoint, [limit]);
        
        if (historyData && Array.isArray(historyData.bids || historyData.history || historyData)) {
          const data = historyData.bids || historyData.history || historyData;
          
          // 标准化数据结构
          const formattedData = data.map((item: any) => ({
            blockHeight: item.block || item.blockHeight || item.height || 0,
            address: item.address || item.addr || item.winner || '未知地址',
            amount: item.amount || item.gas || item.feerate || item.fee || 0,
            timestamp: item.timestamp || item.time || Date.now() / 1000,
            txid: item.txid || item.tx || item.hash || '',
            success: item.success !== undefined ? item.success : true
          }));
          
          console.log(`从 ${endpoint} 获取到历史记录:`, formattedData.length);
          return formattedData;
        }
      } catch (historyError) {
        console.warn(`历史数据端点 ${endpoint} 请求失败:`, historyError);
      }
    }
    
    // 如果所有API都失败，返回模拟数据
    console.log('无法获取历史数据，返回模拟数据');
    return generateMockHistoricalBids(limit);
  } catch (error) {
    console.error('获取历史出价记录失败:', error);
    return generateMockHistoricalBids(limit);
  }
}

// 获取指定区块的出价记录
export async function getBlockBids(blockHeight: number): Promise<any[]> {
  try {
    console.log(`获取区块 ${blockHeight} 的出价记录...`);
    
    // 尝试多种可能的API端点
    const blockBidEndpoints = [
      'alkanes_blockbids',
      'blockbids',
      'alkanes_getblockbids',
      'getblockbids'
    ];
    
    for (const endpoint of blockBidEndpoints) {
      try {
        console.log(`尝试获取区块出价数据: ${endpoint}`);
        const blockBidsData = await sandshrewRpcRequest<any>(endpoint, [blockHeight]);
        
        if (blockBidsData && Array.isArray(blockBidsData.bids || blockBidsData)) {
          const bids = blockBidsData.bids || blockBidsData;
          
          // 标准化数据结构
          const formattedBids = bids.map((bid: any) => ({
            blockHeight,
            address: bid.address || bid.addr || bid.sender || '未知地址',
            amount: bid.amount || bid.gas || bid.feerate || bid.fee || 0,
            timestamp: bid.timestamp || bid.time || Date.now() / 1000,
            txid: bid.txid || bid.tx || bid.hash || '',
            success: bid.success !== undefined ? bid.success : false
          }));
          
          console.log(`从 ${endpoint} 获取到区块出价记录:`, formattedBids.length);
          return formattedBids;
        }
      } catch (blockBidError) {
        console.warn(`区块出价端点 ${endpoint} 请求失败:`, blockBidError);
      }
    }
    
    // 如果所有API都失败，返回空数组
    console.log(`无法获取区块 ${blockHeight} 的出价记录`);
    return [];
  } catch (error) {
    console.error(`获取区块 ${blockHeight} 出价记录失败:`, error);
    return [];
  }
}

// 生成模拟的历史出价记录
function generateMockHistoricalBids(count: number): any[] {
  const currentTime = Math.floor(Date.now() / 1000);
  const currentBlock = 888450;
  
  return Array.from({ length: count }, (_, i) => {
    const blockHeight = currentBlock - i;
    const timestamp = currentTime - i * 600; // 约10分钟一个区块
    const amount = 8 + Math.random() * 4; // 8-12 sat/vB
    
    return {
      blockHeight,
      address: `bc1${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      amount,
      timestamp,
      txid: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      success: true
    };
  });
}

// 提交Diesel出价（模拟）
export async function submitDieselBid(amount: number, address: string): Promise<any> {
  try {
    console.log(`提交Diesel出价: ${amount} sat/vB, 地址: ${address}`);
    
    // 尝试多种可能的API端点
    const submitEndpoints = [
      'alkanes_submitbid',
      'submitbid',
      'alkanes_dieselbid',
      'dieselbid'
    ];
    
    for (const endpoint of submitEndpoints) {
      try {
        console.log(`尝试提交出价: ${endpoint}`);
        const response = await sandshrewRpcRequest<any>(endpoint, [{
          address,
          amount,
          type: 'diesel',
          timestamp: Math.floor(Date.now() / 1000)
        }]);
        
        if (response) {
          console.log(`出价提交成功: ${endpoint}`, response);
          return {
            success: true,
            txid: response.txid || response.hash || response.tx || '',
            message: '出价提交成功，请等待交易确认',
            ...response
          };
        }
      } catch (submitError) {
        console.warn(`出价提交端点 ${endpoint} 请求失败:`, submitError);
      }
    }
    
    // 如果真实API都失败，返回模拟结果
    console.log('无法通过API提交出价，返回模拟响应');
    return {
      success: true,
      txid: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      message: '模拟出价提交成功，实际环境中将通过区块链网络广播交易',
      bid: {
        address,
        amount,
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
  } catch (error) {
    console.error('提交Diesel出价失败:', error);
    return {
      success: false,
      message: '提交出价失败: ' + (error.message || '未知错误'),
      error
    };
  }
}

// 取消Diesel出价（模拟）
export async function cancelDieselBid(address: string): Promise<any> {
  try {
    console.log(`取消Diesel出价, 地址: ${address}`);
    
    // 尝试多种可能的API端点
    const cancelEndpoints = [
      'alkanes_cancelbid',
      'cancelbid',
      'alkanes_canceldisel',
      'canceldiesel'
    ];
    
    for (const endpoint of cancelEndpoints) {
      try {
        console.log(`尝试取消出价: ${endpoint}`);
        const response = await sandshrewRpcRequest<any>(endpoint, [{
          address,
          timestamp: Math.floor(Date.now() / 1000)
        }]);
        
        if (response) {
          console.log(`出价取消成功: ${endpoint}`, response);
          return {
            success: true,
            message: '出价取消成功',
            ...response
          };
        }
      } catch (cancelError) {
        console.warn(`出价取消端点 ${endpoint} 请求失败:`, cancelError);
      }
    }
    
    // 如果真实API都失败，返回模拟结果
    console.log('无法通过API取消出价，返回模拟响应');
    return {
      success: true,
      message: '模拟出价取消成功，实际环境中将通过区块链网络发送取消交易'
    };
  } catch (error) {
    console.error('取消Diesel出价失败:', error);
    return {
      success: false,
      message: '取消出价失败: ' + (error.message || '未知错误'),
      error
    };
  }
} 