import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAlkanesContracts } from '../../lib/api';
import { formatTimestamp, truncateMiddle } from '../../lib/utils';

export default function ContractsList() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchContracts() {
      try {
        setIsLoading(true);
        const contractsData = await getAlkanesContracts();
        setContracts(contractsData || []);
      } catch (err) {
        console.error('合约列表加载错误:', err);
        setError('无法加载合约列表');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchContracts();
  }, []);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alkanes 合约</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">所有合约</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">暂无合约数据</p>
            <p className="text-sm text-gray-400 mt-2">
              可能是节点还未索引任何合约，或者您的节点未正确配置。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    合约 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部署者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部署时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    字节码大小
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/contract/${contract.id}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(contract.id)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.deployer ? (
                        <Link href={`/address/${contract.deployer}`} className="text-blue-600 hover:text-blue-800">
                          {truncateMiddle(contract.deployer)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.deployedAt ? formatTimestamp(contract.deployedAt) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.transactionId ? (
                        <Link href={`/tx/${contract.transactionId}`} className="text-blue-600 hover:text-blue-800">
                          {truncateMiddle(contract.transactionId)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.bytecodeSize || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 检测到还没有合约数据时的提示卡片 */}
      {!isLoading && !error && contracts.length === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">如何部署 Alkanes 合约？</h3>
          <p className="text-sm text-blue-700 mb-4">
            您可以使用 Oyl SDK 部署您的第一个 Alkanes 合约：
          </p>
          <div className="bg-white p-4 rounded-md overflow-x-auto">
            <pre className="text-sm text-gray-800">
              {`import { contractDeployment } from '@oyl/sdk';

const deployResult = await contractDeployment({
  payload,
  gatheredUtxos,
  account,
  reserveNumber: '1',
  provider,
  feeRate,
  signer,
});

console.log('Contract deployed:', deployResult.txId);`}
            </pre>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            <a 
              href="https://alkanes.build/docs/developers/sdk/alkanes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              查看更多部署合约的相关文档 →
            </a>
          </p>
        </div>
      )}
    </div>
  );
} 