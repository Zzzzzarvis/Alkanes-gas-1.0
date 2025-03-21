import React, { useState, useEffect } from 'react';
import { getDieselBalance, getAddressInfo } from '../../lib/api';

export default function DieselPage() {
  const [address, setAddress] = useState<string>('');
  const [dieselBalance, setDieselBalance] = useState<number>(0);
  const [addressInfo, setAddressInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [balanceResult, addressInfoResult] = await Promise.all([
        getDieselBalance(address),
        getAddressInfo(address).catch(() => null)
      ]);
      
      setDieselBalance(balanceResult.balance || 0);
      setAddressInfo(addressInfoResult);
      setShowInfo(true);
    } catch (err: any) {
      console.error('查询失败:', err);
      setError('查询失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Diesel 代币查询</h1>
        
        {/* 查询表单 */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                比特币地址
              </label>
              <input 
                id="address"
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入BTC地址" 
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? '查询中...' : '查询Diesel余额'}
            </button>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          </form>
        </div>
        
        {/* 查询结果 */}
        {showInfo && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">查询结果</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">地址信息</h3>
                <p className="font-mono text-sm break-all">{address}</p>
                
                {addressInfo && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">交易数:</span> 
                      <span className="ml-2 font-medium">{addressInfo.chain_stats?.tx_count || '未知'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">已确认余额:</span> 
                      <span className="ml-2 font-medium">
                        {addressInfo.chain_stats 
                          ? ((addressInfo.chain_stats.funded_txo_sum - addressInfo.chain_stats.spent_txo_sum) / 100000000).toFixed(8)
                          : '未知'} BTC
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Diesel 余额</h3>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-green-700">{dieselBalance.toFixed(8)}</span>
                  <span className="ml-2 text-xl text-green-600">DSL</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 获取 Diesel 指南 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">如何获取 Diesel 代币?</h2>
          
          <div className="space-y-4">
            <p>
              Diesel (DSL) 是 Alkanes 协议的原生代币，用于支付协议费用和参与治理。
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Diesel 铸造机制</h3>
              <p>
                每个新区块中，<strong>第一个</strong>提交 Alkanes 协议交易的用户将获得 Diesel 奖励。
              </p>
            </div>
            
            <h3 className="font-semibold mt-4">获取步骤:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>准备好比特币钱包和一些 BTC</li>
              <li>监控即将到来的区块（本网站首页可查看）</li>
              <li>使用推荐的Gas费率或更高，确保交易优先被打包</li>
              <li>通过 Alkanes 协议提交交易（例如代币转账、智能合约调用等）</li>
              <li>如果您的交易是区块中第一个 Alkanes 交易，您将获得 Diesel 奖励</li>
            </ol>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold">提示：</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>使用高于建议值的Gas费率可以增加您的交易被优先打包的机会</li>
                <li>关注交易池中的竞争情况，选择竞争较少的时间提交交易</li>
                <li>使用自动化工具可以帮助您在最佳时机提交交易</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 