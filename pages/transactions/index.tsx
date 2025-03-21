import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecentBlocks } from '../../lib/api';
import { formatTimestamp, truncateMiddle } from '../../lib/utils';

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchRecentTransactions() {
      try {
        setIsLoading(true);
        
        // 获取最近的区块
        const recentBlocks = await getRecentBlocks(5);
        
        // 从区块中提取交易
        const txs: any[] = [];
        recentBlocks.forEach(block => {
          if (block.tx && Array.isArray(block.tx)) {
            // 为每个交易添加区块信息
            const blockTxs = block.tx.map((tx: any) => ({
              ...tx,
              blockHeight: block.height,
              blockTime: block.time,
              confirmations: block.confirmations,
            }));
            txs.push(...blockTxs);
          }
        });
        
        // 只保留最近的50个交易
        setTransactions(txs.slice(0, 50));
        setError(null);
      } catch (err) {
        console.error('交易列表加载错误:', err);
        setError('无法加载交易列表数据');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecentTransactions();
  }, []);
  
  // 检查交易是否可能是 Alkanes 协议交易
  const isAlkanesTransaction = (tx: any): boolean => {
    return tx.vout && tx.vout.some((output: any) => {
      return output.scriptPubKey && output.scriptPubKey.type === 'nulldata';
    });
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">最近交易</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">交易列表</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">未找到交易</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    区块
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx, index) => (
                  <tr key={tx.txid || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/tx/${tx.txid}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(tx.txid || `txid-${index}`, 15, 15)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.blockHeight !== undefined ? (
                        <Link href={`/block/${tx.blockHeight}`} className="text-blue-600 hover:text-blue-800">
                          {tx.blockHeight}
                        </Link>
                      ) : (
                        <span className="text-gray-500">未确认</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.blockTime ? formatTimestamp(tx.blockTime) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.vin && tx.vin.length > 0 && tx.vin[0].coinbase ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Coinbase
                        </span>
                      ) : isAlkanesTransaction(tx) ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Alkanes
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
        )}
      </div>
      
      {/* 交易搜索 */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">查找交易</h2>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('txid') as HTMLInputElement;
            const txid = input.value.trim();
            
            if (txid) {
              window.location.href = `/tx/${txid}`;
            } else {
              alert('请输入交易ID');
            }
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            name="txid"
            placeholder="输入交易ID (TXID)"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            查找
          </button>
        </form>
      </div>
      
      {/* Alkanes 交易说明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-medium text-green-800 mb-2">Alkanes 协议交易</h3>
        <p className="text-sm text-green-700 mb-4">
          Alkanes 是一个基于比特币的智能合约协议，它允许在比特币区块链上部署和执行智能合约。
          绿色标记的交易表示它们包含 Alkanes 协议相关操作，如合约部署、代币创建或合约调用。
        </p>
        <p className="text-sm text-green-700">
          <a 
            href="https://alkanes.build/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-green-900"
          >
            了解更多关于 Alkanes 协议 →
          </a>
        </p>
      </div>
    </div>
  );
} 