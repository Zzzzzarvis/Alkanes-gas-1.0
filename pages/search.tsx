import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  getBlockByHash, 
  getBlockByHeight, 
  getTransactionById, 
  getAddressInfo,
  getAlkanesContractInfo
} from '../lib/api';
import { truncateMiddle } from '../lib/utils';

// 搜索结果类型
type SearchResultType = 'block' | 'transaction' | 'address' | 'contract' | 'notFound' | null;

export default function Search() {
  const router = useRouter();
  const { q } = router.query;
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [resultType, setResultType] = useState<SearchResultType>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 搜索函数
  useEffect(() => {
    if (!q) return;

    const searchQuery = q as string;
    
    async function performSearch() {
      setIsLoading(true);
      setError(null);
      
      try {
        // 尝试作为区块高度搜索
        if (/^\d+$/.test(searchQuery)) {
          try {
            const blockData = await getBlockByHeight(parseInt(searchQuery, 10));
            if (blockData) {
              setResultType('block');
              setResultData(blockData);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            // 区块高度搜索失败，继续尝试其他类型
          }
        }
        
        // 尝试作为区块哈希搜索
        try {
          const blockData = await getBlockByHash(searchQuery);
          if (blockData) {
            setResultType('block');
            setResultData(blockData);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // 区块哈希搜索失败，继续尝试其他类型
        }
        
        // 尝试作为交易ID搜索
        try {
          const txData = await getTransactionById(searchQuery);
          if (txData) {
            setResultType('transaction');
            setResultData(txData);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // 交易ID搜索失败，继续尝试其他类型
        }
        
        // 尝试作为地址搜索
        try {
          const addressData = await getAddressInfo(searchQuery);
          if (addressData) {
            setResultType('address');
            setResultData(addressData);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // 地址搜索失败，继续尝试其他类型
        }
        
        // 尝试作为合约ID搜索
        try {
          const contractData = await getAlkanesContractInfo(searchQuery);
          if (contractData) {
            setResultType('contract');
            setResultData(contractData);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // 合约搜索失败，继续处理
        }
        
        // 所有搜索都失败
        setResultType('notFound');
      } catch (error) {
        setError('搜索处理过程中出错');
        console.error('搜索错误:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    performSearch();
  }, [q]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">搜索中...</p>
      </div>
    );
  }
  
  // 错误状态
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
  
  // 未找到结果
  if (resultType === 'notFound' || !resultData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">未找到与 "<span className="font-medium">{q}</span>" 相关的结果</p>
        <p className="mt-2 text-sm text-gray-500">
          请尝试搜索区块高度、区块哈希、交易ID、钱包地址或合约ID
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          返回首页
        </button>
      </div>
    );
  }
  
  // 根据结果类型重定向到对应页面
  useEffect(() => {
    if (!isLoading && resultType && resultData) {
      switch (resultType) {
        case 'block':
          router.push(`/block/${resultData.hash}`);
          break;
        case 'transaction':
          router.push(`/tx/${resultData.txid}`);
          break;
        case 'address':
          router.push(`/address/${q}`);
          break;
        case 'contract':
          router.push(`/contract/${q}`);
          break;
      }
    }
  }, [resultType, resultData, isLoading, router, q]);
  
  // 显示搜索结果的简要信息（仅在重定向前短暂显示）
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-xl font-bold mb-4">搜索结果</h1>
      
      {resultType === 'block' && (
        <div>
          <p className="text-gray-700">找到区块 - 重定向中...</p>
          <p className="text-sm text-gray-500 mt-1">
            区块高度: {resultData.height}, 
            哈希: {truncateMiddle(resultData.hash, 10, 10)}
          </p>
        </div>
      )}
      
      {resultType === 'transaction' && (
        <div>
          <p className="text-gray-700">找到交易 - 重定向中...</p>
          <p className="text-sm text-gray-500 mt-1">
            交易ID: {truncateMiddle(resultData.txid, 10, 10)}
          </p>
        </div>
      )}
      
      {resultType === 'address' && (
        <div>
          <p className="text-gray-700">找到地址 - 重定向中...</p>
          <p className="text-sm text-gray-500 mt-1">
            地址: {truncateMiddle(q as string, 10, 10)}
          </p>
        </div>
      )}
      
      {resultType === 'contract' && (
        <div>
          <p className="text-gray-700">找到合约 - 重定向中...</p>
          <p className="text-sm text-gray-500 mt-1">
            合约ID: {truncateMiddle(q as string, 10, 10)}
          </p>
        </div>
      )}
    </div>
  );
}