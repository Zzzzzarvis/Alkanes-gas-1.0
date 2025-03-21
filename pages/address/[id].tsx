import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAddressBalance, getAddressUtxos, getProtorunesByAddress } from '../../lib/api';
import { formatBtcAmount, truncateMiddle } from '../../lib/utils';

export default function AddressDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [balance, setBalance] = useState<number>(0);
  const [utxos, setUtxos] = useState<any[]>([]);
  const [protoruneBalances, setProtoruneBalances] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchAddressData() {
      try {
        setIsLoading(true);
        
        // 获取余额信息
        const balanceData = await getAddressBalance(id as string);
        setBalance(balanceData);
        
        // 获取 UTXO 列表
        const utxosData = await getAddressUtxos(id as string);
        setUtxos(utxosData || []);
        
        // 尝试获取 Protorunes 余额（假设 protocolTag 为 1）
        try {
          const protorunesData = await getProtorunesByAddress(id as string, 1);
          setProtoruneBalances(protorunesData);
        } catch (err) {
          console.log('没有 Protorunes 数据或 API 不支持');
        }
        
      } catch (err) {
        console.error('地址数据加载错误:', err);
        setError('无法加载地址数据');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAddressData();
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
  
  // 判断是否有 Alkanes 代币
  const hasAlkanesTokens = protoruneBalances && Object.keys(protoruneBalances).length > 0;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">地址</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">地址信息</h2>
        </div>
        
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">地址</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{id}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">余额</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">{formatBtcAmount(balance)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">未花费输出 (UTXOs)</dt>
              <dd className="mt-1 text-sm text-gray-900">{utxos.length} 个</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Alkanes 代币余额 */}
      {hasAlkanesTokens && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-4 bg-green-50">
            <h2 className="text-xl font-semibold text-green-800">Alkanes 代币</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代币 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    余额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(protoruneBalances).map(([tokenId, data]: [string, any]) => (
                  <tr key={tokenId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/token/${tokenId}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(tokenId)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {data.name || '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {data.balance || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* UTXOs 列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">未花费的交易输出 (UTXOs)</h2>
        </div>
        
        {utxos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">暂无 UTXO</p>
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
                    索引
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    确认数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {utxos.map((utxo) => (
                  <tr key={`${utxo.txid}-${utxo.vout}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/tx/${utxo.txid}`} className="text-blue-600 hover:text-blue-800">
                        {truncateMiddle(utxo.txid)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {utxo.vout}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatBtcAmount(utxo.amount * 100000000)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {utxo.confirmations || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 