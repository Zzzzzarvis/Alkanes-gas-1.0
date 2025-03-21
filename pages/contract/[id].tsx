import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAlkanesContractInfo } from '../../lib/api';
import { formatTimestamp, truncateMiddle } from '../../lib/utils';

export default function ContractDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchContract() {
      try {
        setIsLoading(true);
        const contractData = await getAlkanesContractInfo(id as string);
        setContract(contractData);
      } catch (err) {
        console.error('合约数据加载错误:', err);
        setError('无法加载合约数据');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchContract();
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
  
  if (!contract) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">未找到合约</p>
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
      <h1 className="text-2xl font-bold mb-6">Alkanes 合约</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">合约信息</h2>
        </div>
        
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">合约 ID</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{contract.id || id}</dd>
            </div>
            
            {contract.deployedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">部署时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatTimestamp(contract.deployedAt)}</dd>
              </div>
            )}
            
            {contract.deployer && (
              <div>
                <dt className="text-sm font-medium text-gray-500">部署者</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/address/${contract.deployer}`} className="text-blue-600 hover:text-blue-800">
                    {truncateMiddle(contract.deployer, 12, 12)}
                  </Link>
                </dd>
              </div>
            )}
            
            {contract.blockHeight !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">区块高度</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/block/${contract.blockHeight}`} className="text-blue-600 hover:text-blue-800">
                    {contract.blockHeight}
                  </Link>
                </dd>
              </div>
            )}
            
            {contract.transactionId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">部署交易</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/tx/${contract.transactionId}`} className="text-blue-600 hover:text-blue-800">
                    {truncateMiddle(contract.transactionId, 12, 12)}
                  </Link>
                </dd>
              </div>
            )}
            
            {contract.bytecodeSize !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">字节码大小</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.bytecodeSize} 字节</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* 合约方法 */}
      {contract.abi && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold">合约方法</h2>
          </div>
          
          <div className="p-6">
            {contract.abi.length > 0 ? (
              <div className="space-y-4">
                {contract.abi.map((method: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-blue-800">{method.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{method.type}</p>
                    
                    {method.inputs && method.inputs.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs text-gray-500 uppercase">输入参数</h4>
                        <ul className="mt-1 space-y-1">
                          {method.inputs.map((input: any, i: number) => (
                            <li key={i} className="text-sm">
                              <span className="font-mono text-blue-600">{input.type}</span>
                              <span className="text-gray-600"> {input.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {method.outputs && method.outputs.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs text-gray-500 uppercase">返回值</h4>
                        <ul className="mt-1 space-y-1">
                          {method.outputs.map((output: any, i: number) => (
                            <li key={i} className="text-sm">
                              <span className="font-mono text-green-600">{output.type}</span>
                              {output.name && <span className="text-gray-600"> {output.name}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">未找到合约方法或ABI不可用</p>
            )}
          </div>
        </div>
      )}
      
      {/* 合约交易 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">合约交易</h2>
        </div>
        
        {contract.transactions && contract.transactions.length > 0 ? (
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
                    方法
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contract.transactions.map((tx: any, index: number) => (
                  <tr key={tx.txid || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/tx/${tx.txid}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(tx.txid, 12, 12)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.blockHeight ? (
                        <Link href={`/block/${tx.blockHeight}`} className="text-blue-600 hover:text-blue-800">
                          {tx.blockHeight}
                        </Link>
                      ) : (
                        <span className="text-gray-500">未确认</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.timestamp ? formatTimestamp(tx.timestamp) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tx.method === 'deploy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.method || '--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">暂无交易记录</p>
          </div>
        )}
      </div>
    </div>
  );
} 