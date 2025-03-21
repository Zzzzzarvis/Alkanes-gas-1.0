import React, { useState, useEffect } from 'react';
import { getBlockCount, getBlockByHeight } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';

interface BlockStatsProps {
  className?: string;
}

export default function BlockStats({ className = '' }: BlockStatsProps) {
  const [blockCount, setBlockCount] = useState<number | null>(null);
  const [lastBlock, setLastBlock] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBlockStats = async () => {
      try {
        setLoading(true);
        
        // 获取区块高度
        const count = await getBlockCount();
        setBlockCount(count);
        
        // 获取最新区块
        const block = await getBlockByHeight(count);
        setLastBlock(block);
        
        setError(null);
      } catch (err) {
        console.error('获取区块统计失败:', err);
        setError('无法加载区块链统计信息');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlockStats();
    
    // 每30秒更新一次数据
    const interval = setInterval(fetchBlockStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <LoadingSpinner size="sm" message="加载区块统计信息..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 text-center ${className}`}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!blockCount || !lastBlock) {
    return null;
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 py-3">
        <h2 className="text-white text-lg font-semibold">区块链状态</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">当前高度</p>
            <p className="text-xl font-bold text-blue-700">{blockCount}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm">最新出块时间</p>
            <p className="text-gray-700">
              {new Date(lastBlock.time * 1000).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm">交易数量</p>
            <p className="text-gray-700">{lastBlock.tx?.length || 0}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm">区块大小</p>
            <p className="text-gray-700">{lastBlock.size} 字节</p>
          </div>
        </div>
      </div>
    </div>
  );
} 