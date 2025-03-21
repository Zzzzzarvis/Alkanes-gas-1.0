import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlockCount, getRecentBlocks, getCurrentBlockAlkanesTxs } from '../../lib/api';
import { formatTimestamp, formatBytes, truncateMiddle } from '../../lib/utils';

export default function BlocksPage() {
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [alkanesTxsCount, setAlkanesTxsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const blocksPerPage = 15;

  // 获取区块数据
  useEffect(() => {
    fetchData();
    
    // 设置30秒刷新间隔
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取最新区块高度
      const height = await getBlockCount();
      setBlockHeight(height);
      
      // 计算要获取的区块范围
      const startBlock = height - (currentPage - 1) * blocksPerPage;
      const blocksData = await getRecentBlocks(blocksPerPage);
      setBlocks(blocksData);
      
      // 获取当前区块中的Alkanes交易数量
      try {
        const alkanesTxs = await getCurrentBlockAlkanesTxs();
        setAlkanesTxsCount(alkanesTxs.length);
      } catch (err) {
        console.error('获取Alkanes交易失败:', err);
        setAlkanesTxsCount(0);
      }
    } catch (err: any) {
      console.error('获取区块数据失败:', err);
      setError('获取区块数据失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 页码变化
  const handlePageChange = (page: number) => {
    if (page <= 0 || page > Math.ceil(blockHeight / blocksPerPage)) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">区块列表</h1>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">最新区块高度</h2>
            <p className="text-2xl font-bold">{blockHeight}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">当前区块Alkanes交易</h2>
            <p className="text-2xl font-bold">{alkanesTxsCount}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">操作</h2>
            <Link href="/diesel" className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              查询Diesel余额
            </Link>
          </div>
        </div>
        
        {loading && !blocks.length ? (
          <div className="text-center py-10">加载中...</div>
        ) : error && !blocks.length ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">错误!</strong>
            <span className="block sm:inline"> {error}</span>
            <button 
              onClick={fetchData} 
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left">高度</th>
                      <th className="py-2 px-4 border-b text-left">哈希</th>
                      <th className="py-2 px-4 border-b text-left">时间</th>
                      <th className="py-2 px-4 border-b text-left">交易数</th>
                      <th className="py-2 px-4 border-b text-left">大小</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((block) => (
                      <tr key={block.id || block.hash} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          <Link href={`/block/${block.height}`} className="text-blue-600 hover:text-blue-800">
                            {block.height}
                          </Link>
                        </td>
                        <td className="py-2 px-4 border-b font-mono text-xs">
                          <Link href={`/block/${block.hash}`} className="text-blue-600 hover:text-blue-800">
                            {block.id || block.hash}
                          </Link>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Date(block.timestamp * 1000).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b">{block.tx_count || block.tx?.length || 0}</td>
                        <td className="py-2 px-4 border-b">{(block.size / 1024).toFixed(2)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 分页 */}
            <div className="flex justify-between items-center">
              <div>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className={`mr-2 py-2 px-4 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-700 text-white'
                  }`}
                >
                  上一页
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage * blocksPerPage >= blockHeight}
                  className={`py-2 px-4 rounded ${
                    currentPage * blocksPerPage >= blockHeight 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-700 text-white'
                  }`}
                >
                  下一页
                </button>
              </div>
              
              <div className="text-gray-600">
                第 {currentPage} 页 / 共 {Math.ceil(blockHeight / blocksPerPage)} 页
              </div>
            </div>
          </>
        )}
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>提示:</strong> Diesel奖励将发放给每个区块中第一个Alkanes协议交易的发送者。
                监控区块信息可以帮助您了解交易竞争情况。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 