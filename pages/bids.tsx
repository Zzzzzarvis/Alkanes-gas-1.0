import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDieselBids, getBlockCount, getHistoricalBids, submitDieselBid, cancelDieselBid } from '../lib/api';
import { formatTimestamp } from '../lib/utils';

interface Bid {
  address: string;
  amount: number;
  timestamp: number;
  origin?: string;
}

interface HistoricalBid {
  blockHeight: number;
  address: string;
  amount: number;
  timestamp: number;
  txid: string;
  success: boolean;
}

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [historicalBids, setHistoricalBids] = useState<HistoricalBid[]>([]);
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidSubmitting, setBidSubmitting] = useState<boolean>(false);
  const [bidResult, setBidResult] = useState<{success: boolean; message: string} | null>(null);
  const [wallet, setWallet] = useState<string>('');
  // 用于客户端渲染的状态
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 设置客户端渲染标记
    setIsClient(true);
    
    fetchData();
    fetchHistoricalData();
    
    // 设置每5秒刷新一次数据
    const intervalId = setInterval(fetchData, 5000);
    
    // 历史数据每分钟刷新一次
    const historyIntervalId = setInterval(fetchHistoricalData, 60000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(historyIntervalId);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 并行获取出价和区块高度
      const [bidsData, height] = await Promise.all([
        getDieselBids(),
        getBlockCount()
      ]);
      
      setBids(bidsData);
      setBlockHeight(height);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err: any) {
      console.error('获取数据失败:', err);
      setError('获取数据失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHistoricalData = async () => {
    setHistoryLoading(true);
    try {
      const historyData = await getHistoricalBids(20);
      setHistoricalBids(historyData);
    } catch (err: any) {
      console.error('获取历史数据失败:', err);
      // 不显示错误提示，只在控制台记录
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理地址截断显示
  const formatAddress = (address: string) => {
    if (!address) return '未知地址';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  // 处理交易ID截断显示
  const formatTxid = (txid: string) => {
    if (!txid) return '-';
    if (txid.length <= 10) return txid;
    return `${txid.substring(0, 6)}...${txid.substring(txid.length - 4)}`;
  };

  // 渲染出价的时间间隔
  const getBidTime = (timestamp: number) => {
    if (!isClient) return ''; // 服务端渲染时返回空字符串
    
    const now = Date.now() / 1000;
    const diffSeconds = Math.floor(now - timestamp);
    
    if (diffSeconds < 60) return `${diffSeconds}秒前`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}分钟前`;
    return formatTimestamp(timestamp);
  };

  // 处理提交出价
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setBidResult({
        success: false,
        message: '请输入有效的出价金额'
      });
      return;
    }
    
    if (!wallet || wallet.trim() === '') {
      setBidResult({
        success: false,
        message: '请输入钱包地址'
      });
      return;
    }
    
    setBidSubmitting(true);
    setBidResult(null);
    
    try {
      const amount = parseFloat(bidAmount);
      const result = await submitDieselBid({
        address: wallet,
        amount: amount
      });
      
      if (result.success) {
        setBidResult({
          success: true,
          message: `出价提交成功: ${amount.toFixed(2)} sat/vB`
        });
        setBidAmount('');
        // 刷新出价数据
        fetchData();
      } else {
        setBidResult({
          success: false,
          message: `出价提交失败: ${result.error || '未知错误'}`
        });
      }
    } catch (err: any) {
      setBidResult({
        success: false,
        message: `出价提交错误: ${err.message || '未知错误'}`
      });
    } finally {
      setBidSubmitting(false);
    }
  };
  
  // 取消当前出价
  const handleCancelBid = async () => {
    if (!wallet || wallet.trim() === '') {
      setBidResult({
        success: false,
        message: '请输入钱包地址'
      });
      return;
    }
    
    setBidSubmitting(true);
    setBidResult(null);
    
    try {
      const result = await cancelDieselBid({
        address: wallet
      });
      
      if (result.success) {
        setBidResult({
          success: true,
          message: `取消出价成功`
        });
        // 刷新出价数据
        fetchData();
      } else {
        setBidResult({
          success: false,
          message: `取消出价失败: ${result.error || '未知错误'}`
        });
      }
    } catch (err: any) {
      setBidResult({
        success: false,
        message: `取消出价错误: ${err.message || '未知错误'}`
      });
    } finally {
      setBidSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Diesel 出价监控</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          实时监控 Diesel 铸造竞价状态，掌握最佳铸造时机
        </p>
        
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link href="/" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            返回主页
          </Link>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            刷新数据
          </button>
        </div>
      </div>
      
      {/* 状态信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-blue-700">当前区块高度: <span className="font-bold">{blockHeight}</span></h2>
            <p className="text-gray-500 text-sm mt-1">
              最后更新时间: {isClient ? formatTimestamp(lastUpdated / 1000) : ''}
            </p>
          </div>
          
          <div className="mt-2 md:mt-0">
            <span className={`px-4 py-2 rounded-full text-white ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {loading ? '正在加载...' : '实时监控中'}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">错误!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
      </div>
      
      {/* 标签页切换 */}
      <div className="mb-4">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            当前出价 ({bids.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            历史记录 ({historicalBids.length})
          </button>
        </nav>
      </div>
      
      {/* 当前出价列表 */}
      {activeTab === 'current' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">当前出价状态</h2>
          
          {bids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? '正在获取出价数据...' : '当前没有有效出价'}
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        排名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        出价地址
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        出价金额
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        提交时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数据来源
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bids.map((bid, index) => (
                      <tr key={index} className={index === 0 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                              index === 0 ? 'bg-yellow-500 text-white' : 
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-yellow-700 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAddress(bid.address)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${
                            index === 0 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {bid.amount.toFixed(2)} sat/vB
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {isClient ? getBidTime(bid.timestamp) : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bid.origin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 出价分析 */}
              {bids.length > 0 && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">出价分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-gray-500 text-sm">最高出价</p>
                      <p className="text-2xl font-bold text-yellow-600">{bids[0].amount.toFixed(2)} sat/vB</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-gray-500 text-sm">平均出价</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(bids.reduce((acc, bid) => acc + bid.amount, 0) / bids.length).toFixed(2)} sat/vB
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-gray-500 text-sm">出价差距</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {bids.length > 1 ? (bids[0].amount - bids[bids.length - 1].amount).toFixed(2) : '0.00'} sat/vB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 自动出价表单 */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">自动出价</h3>
            
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
                <input
                  type="text"
                  id="wallet"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="输入您的钱包地址"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
              
              <div>
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">出价金额 (sat/vB)</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    name="bidAmount"
                    id="bidAmount"
                    min="1"
                    step="0.1"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 p-2 border"
                    placeholder="输入出价金额"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    sat/vB
                  </span>
                </div>
                {bids.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    推荐出价: {(bids[0].amount + 0.2).toFixed(2)} sat/vB (略高于当前最高出价)
                  </p>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={bidSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {bidSubmitting ? '提交中...' : '提交出价'}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancelBid}
                  disabled={bidSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  取消当前出价
                </button>
              </div>
            </form>
            
            {bidResult && (
              <div className={`mt-4 p-3 rounded-md ${bidResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {bidResult.message}
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500">
              <p>提示: 出价越高，交易被打包的优先级越高，成功铸造 Diesel 的机会也越大。</p>
              <p>但过高的出价会增加您的交易成本，请根据当前市场情况选择合适的出价金额。</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 历史出价记录 */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">历史出价记录</h2>
          
          {historicalBids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {historyLoading ? '正在加载历史数据...' : '暂无历史出价记录'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      区块高度
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      地址
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出价金额
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalBids.map((bid, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bid.blockHeight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAddress(bid.address)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bid.amount.toFixed(2)} sat/vB
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {isClient ? formatTimestamp(bid.timestamp) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatTxid(bid.txid)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bid.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {bid.success ? '成功' : '失败'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 历史统计 */}
          {historicalBids.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">历史数据分析</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">历史最高出价</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {Math.max(...historicalBids.map(bid => bid.amount)).toFixed(2)} sat/vB
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">历史平均出价</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(historicalBids.reduce((acc, bid) => acc + bid.amount, 0) / historicalBids.length).toFixed(2)} sat/vB
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">成功率</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(historicalBids.filter(bid => bid.success).length / historicalBids.length * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 使用说明 */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Diesel 铸造出价说明</h2>
        <div className="space-y-3 text-gray-600">
          <p>
            Diesel 每个区块只能铸造一次，由第一个成功调用 Diesel 合约的交易获得。竞争者通过提高交易的 gas 费率来提高自己交易被打包的优先级。
          </p>
          <p>
            当前出价表展示了最新的出价情况，排名第一的出价将有最高概率在下一个区块中获得 Diesel 铸造权。
          </p>
          <p>
            出价过低可能导致交易不被矿工打包，出价过高则会增加您的交易成本。建议根据当前市场情况和竞争激烈程度调整您的出价策略。
          </p>
        </div>
      </div>
    </div>
  );
} 