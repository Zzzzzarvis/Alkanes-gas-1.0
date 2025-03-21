// 格式化时间戳为可读时间
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return '-';
  // 使用固定格式而非依赖本地化的toLocaleString
  const date = new Date(timestamp * 1000);
  
  // 使用ISO格式的日期和时间，避免本地化差异
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 格式化时间段为X分Y秒格式
export const formatTimeSpan = (seconds: number): string => {
  if (seconds <= 0) return '已就绪';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  
  return `${remainingSeconds}秒`;
};

// 计算Gas费率
export const calculateFeeRate = (fee: number, vsize: number): number => {
  if (!vsize) return 0;
  return parseFloat((fee / vsize).toFixed(2));
};

// 格式化Gas费率为带颜色的描述
export const formatFeeRateDescription = (feeRate: number): { text: string; color: string } => {
  if (feeRate < 10) {
    return { text: '低', color: 'text-green-600' };
  } else if (feeRate < 30) {
    return { text: '中', color: 'text-yellow-600' };
  } else {
    return { text: '高', color: 'text-red-600' };
  }
};

// 格式化BTC金额
export const formatBTC = (satoshis: number, precision: number = 8): string => {
  return (satoshis / 100000000).toFixed(precision) + ' BTC';
};

// 格式化Satoshi金额
export const formatSatoshis = (satoshis: number): string => {
  return satoshis.toLocaleString() + ' sats';
};

// 截断字符串
export const truncateString = (str: string, start: number = 6, end: number = 4): string => {
  if (!str) return '';
  if (str.length <= start + end) return str;
  return `${str.substring(0, start)}...${str.substring(str.length - end)}`;
};

// 计算交易成功概率基于Gas费率和网络拥堵情况
export const calculateTxSuccessProbability = (
  feeRate: number,
  recommendedFeeRate: number,
  networkCongestion: number // 0-10，0表示不拥堵，10表示非常拥堵
): number => {
  // 如果费率低于推荐费率，成功概率很低
  if (feeRate < recommendedFeeRate) {
    return Math.max(0.05, 0.3 * (feeRate / recommendedFeeRate));
  }
  
  // 基础成功率基于费率比例
  const ratio = feeRate / recommendedFeeRate;
  let baseProbability = Math.min(0.95, 0.5 + (ratio - 1) * 0.3);
  
  // 考虑网络拥堵因素
  const congestionFactor = 1 - (networkCongestion / 20); // 拥堵越严重，成功率越低
  
  // 计算最终概率
  return Math.min(0.95, baseProbability * congestionFactor);
};

// 格式化交易状态为文本描述
export const formatTxStatus = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'confirmed':
      return { text: '已确认', color: 'text-green-600' };
    case 'pending':
      return { text: '待确认', color: 'text-yellow-600' };
    case 'failed':
      return { text: '失败', color: 'text-red-600' };
    default:
      return { text: '未知', color: 'text-gray-600' };
  }
};

// 生成随机哈希值 (用于测试)
export const generateRandomHash = (): string => {
  let result = '';
  const characters = '0123456789abcdef';
  
  // 生成64位十六进制字符
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// 计算铸造窗口打开状态
export const calculateMintingWindowStatus = (
  currentBlock: number,
  targetBlock: number
): { isOpen: boolean; progress: number } => {
  // 铸造窗口在目标区块的前5个区块开始准备，在目标区块完全打开
  const blockDiff = targetBlock - currentBlock;
  
  if (blockDiff <= 0) {
    return { isOpen: true, progress: 100 };
  } else if (blockDiff <= 5) {
    // 在5个区块内，窗口部分打开
    return { isOpen: false, progress: (5 - blockDiff) * 20 };
  } else {
    return { isOpen: false, progress: 0 };
  }
};

// 将字节大小格式化为人类可读形式
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 