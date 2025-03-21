import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTransaction } from '../../lib/api';
import { formatTimestamp, truncateMiddle, formatBtcAmount } from '../../lib/utils';

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchTransaction() {
      try {
        setIsLoading(true);
        const txData = await getTransaction(id as string);
        setTransaction(txData);
      } catch (err) {
        console.error('交易数据加载错误:', err);
        setError('无法加载交易数据');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTransaction();
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
  
  if (!transaction) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">未找到交易</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    );
  }
  
  // 是否为 Alkanes 协议交易的简单判断（实际项目中需要更复杂的判断逻辑）
  const isAlkanesTransaction = transaction.vout && transaction.vout.some((output: any) => {
    // 根据具体的 Alkanes 协议特征来判断
    return output.scriptPubKey && output.scriptPubKey.type === 'nulldata';
  });
  
  // 计算交易总输入输出
  const totalInput = transaction.vin && transaction.vin.reduce((acc: number, input: any) => {
    return acc + (input.value || 0);
  }, 0);
  
  const totalOutput = transaction.vout && transaction.vout.reduce((acc: number, output: any) => {
    return acc + (output.value || 0);
  }, 0);
  
  // 估算手续费（输入 - 输出）
  const fee = Math.max(0, totalInput - totalOutput);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">交易详情</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">交易信息</h2>
          {isAlkanesTransaction && (
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Alkanes 协议
            </span>
          )}
        </div>
        
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">交易 ID</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{transaction.txid}</dd>
            </div>
            
            {transaction.blockhash && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">区块哈希</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/block/${transaction.blockhash}`} className="text-blue-600 hover:text-blue-800 break-all">
                    {transaction.blockhash}
                  </Link>
                </dd>
              </div>
            )}
            
            {transaction.confirmations !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">确认数</dt>
                <dd className="mt-1 text-sm text-gray-900">{transaction.confirmations}</dd>
              </div>
            )}
            
            {transaction.time && (
              <div>
                <dt className="text-sm font-medium text-gray-500">时间戳</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatTimestamp(transaction.time)}</dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500">大小</dt>
              <dd className="mt-1 text-sm text-gray-900">{transaction.size} 字节</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">手续费</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatBtcAmount(fee * 100000000)}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Alkanes 协议信息 */}
      {isAlkanesTransaction && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4 bg-green-50">
            <h2 className="text-xl font-semibold text-green-800">Alkanes 协议信息</h2>
          </div>
          
          <div className="p-6">
            <p className="text-gray-500 italic mb-4">这是一个 Alkanes 协议交易，详细信息正在分析中...</p>
            
            {/* 这里将来可以添加 Alkanes 协议特有的信息展示 */}
            <dl className="grid grid-cols-1 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">操作类型</dt>
                <dd className="mt-1 text-sm text-gray-900">--</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">合约 ID</dt>
                <dd className="mt-1 text-sm text-gray-900">--</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">调用数据</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">--</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      
      {/* 输入 */}
      {transaction.vin && transaction.vin.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold">输入 ({transaction.vin.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    索引
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上一个交易
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transaction.vin.map((input: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {input.txid ? (
                        <Link href={`/tx/${input.txid}`} className="text-blue-600 hover:text-blue-800">
                          {truncateMiddle(input.txid)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Coinbase</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {input.address ? (
                        <Link href={`/address/${input.address}`} className="text-blue-600 hover:text-blue-800">
                          {truncateMiddle(input.address)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {input.value ? formatBtcAmount(input.value * 100000000) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 输出 */}
      {transaction.vout && transaction.vout.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold">输出 ({transaction.vout.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    索引
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transaction.vout.map((output: any) => (
                  <tr key={output.n} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {output.n}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {output.scriptPubKey && output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0 ? (
                        <Link href={`/address/${output.scriptPubKey.addresses[0]}`} className="text-blue-600 hover:text-blue-800">
                          {truncateMiddle(output.scriptPubKey.addresses[0])}
                        </Link>
                      ) : (
                        <span className="text-gray-500">
                          {output.scriptPubKey && output.scriptPubKey.type === 'nulldata' ? 'OP_RETURN' : '--'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {output.scriptPubKey && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          output.scriptPubKey.type === 'nulldata' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {output.scriptPubKey.type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatBtcAmount(output.value * 100000000)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 