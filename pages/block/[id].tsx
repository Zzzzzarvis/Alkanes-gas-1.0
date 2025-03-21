import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getBlockByHeight, getBlockCount } from '../../lib/api';
import { formatTimestamp, truncateMiddle, formatBytes } from '../../lib/utils';

export default function BlockDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [block, setBlock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchBlock() {
      try {
        setIsLoading(true);
        
        // 检查 id 是否为数字（区块高度）或哈希
        const isHeight = /^\d+$/.test(id as string);
        
        // 根据 id 类型获取区块信息
        if (isHeight) {
          const blockData = await getBlockByHeight(parseInt(id as string, 10));
          setBlock(blockData);
        } else {
          // 如果是哈希，可能需要另一个 API 方法
          // 这里简化处理，假设 id 是高度
          setError('暂不支持通过哈希查询区块');
        }
      } catch (err) {
        console.error('区块数据加载错误:', err);
        setError('无法加载区块数据');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBlock();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    );
  }
  
  if (!block) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">未找到区块</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">区块 #{block.height}</h1>
        <div className="flex space-x-2">
          {block.height > 0 && (
            <Link
              href={`/block/${block.height - 1}`}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              上一个区块
            </Link>
          )}
          <Link
            href={`/block/${block.height + 1}`}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            下一个区块
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">区块信息</h2>
        </div>
        
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">区块哈希</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{block.hash}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">高度</dt>
              <dd className="mt-1 text-sm text-gray-900">{block.height}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">确认数</dt>
              <dd className="mt-1 text-sm text-gray-900">--</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">时间戳</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatTimestamp(block.time)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">交易数</dt>
              <dd className="mt-1 text-sm text-gray-900">{block.tx ? block.tx.length : 0}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">大小</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatBytes(block.size)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">版本</dt>
              <dd className="mt-1 text-sm text-gray-900">{block.version}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">难度</dt>
              <dd className="mt-1 text-sm text-gray-900">{block.difficulty}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Merkle Root</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{block.merkleroot}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Nonce</dt>
              <dd className="mt-1 text-sm text-gray-900">{block.nonce}</dd>
            </div>
            
            {block.previousblockhash && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">上一区块哈希</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/block/${block.height - 1}`} className="text-blue-600 hover:text-blue-800 break-all">
                    {block.previousblockhash}
                  </Link>
                </dd>
              </div>
            )}
            
            {block.nextblockhash && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">下一区块哈希</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/block/${block.height + 1}`} className="text-blue-600 hover:text-blue-800 break-all">
                    {block.nextblockhash}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">区块交易 ({block.tx ? block.tx.length : 0})</h2>
        </div>
        
        {block.tx && block.tx.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {block.tx.map((tx: any, index: number) => (
                  <tr key={tx.txid || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/tx/${tx.txid}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(tx.txid || `txid-${index}`, 20, 20)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatBytes(tx.size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {index === 0 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Coinbase
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          普通交易
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">没有交易</p>
          </div>
        )}
      </div>
    </div>
  );
} 