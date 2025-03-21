import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function DieselGuidePage() {
  return (
    <Layout title="Diesel 代币获取指南">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Diesel 代币获取指南</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">什么是 Diesel 代币？</h2>
          <p className="mb-4">Diesel是Alkanes协议的原生代币，它具有以下特点：</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>作为Alkanes协议中的Gas费用代币</li>
            <li>通过特殊的铸造交易获得</li>
            <li>总量恒定，无通胀</li>
            <li>用于支付Alkanes交易的费用</li>
            <li>获取方式特殊，需要特定的策略和技巧</li>
          </ul>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">Diesel 分配规则</h2>
          <p className="mb-4">Diesel代币分配遵循以下规则：</p>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium text-blue-600 mb-2">代币总量</h3>
            <p>Diesel代币总量固定，通过铸造交易和区块奖励两种方式分配。</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-xl font-medium text-blue-600 mb-2">分配比例</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-700">初始分配</h4>
                <p>通过铸造交易分配给参与者</p>
                <p className="text-2xl font-bold text-blue-800 mt-2">50%</p>
              </div>
              <div className="flex-1 bg-green-50 p-3 rounded border border-green-200">
                <h4 className="font-semibold text-green-700">区块奖励</h4>
                <p>通过区块铸造奖励分配</p>
                <p className="text-2xl font-bold text-green-800 mt-2">50%</p>
              </div>
            </div>
          </div>
          
          <p>随着时间推移，铸造交易将变得越来越难，因此越早参与铸造，成功率越高。</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">获取 Diesel 的方法</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium text-blue-600 mb-2">1. 铸造交易</h3>
            <p className="mb-2">通过创建特殊的铸造交易，在区块高度达到有效窗口时，可以获得Diesel代币。</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="font-medium">铸造交易需要满足以下条件：</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>在有效的区块窗口内提交</li>
                <li>满足Gas费率要求</li>
                <li>采用正确的交易结构</li>
                <li>与其他铸造交易竞争</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium text-blue-600 mb-2">2. 提高成功率的策略</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">监控窗口时机</h4>
                <p>使用我们的监控工具，实时掌握铸造窗口开启时间，增加提交成功率。</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">优化Gas费率</h4>
                <p>根据当前网络拥堵情况，设置合理的Gas费率，既不浪费资金，又能确保交易及时处理。</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">自动化提交</h4>
                <p>使用自动交易工具，在最佳时机自动提交交易，无需手动操作。</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">多账户策略</h4>
                <p>使用多个BTC地址同时参与铸造，提高获得Diesel的概率。</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-medium text-blue-600 mb-2">3. 从二级市场获取</h3>
            <p>随着Alkanes生态发展，未来可能会有交易市场出现，可以通过交易获取Diesel代币。</p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">自动交易工具使用说明</h2>
          <p className="mb-4">我们提供了专业的自动交易工具，助您更高效地获取Diesel代币：</p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-blue-600">实时监控</h3>
              <p>自动监控区块链状态，捕捉最佳铸造窗口</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-blue-600">智能决策</h3>
              <p>根据网络状况自动调整Gas费率和交易策略</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-blue-600">自动提交</h3>
              <p>在最佳时机自动提交交易，提高成功率</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Link href="/monitor" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
              使用自动交易工具
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">常见问题 (FAQ)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Alkanes协议的交易是如何工作的？</h3>
              <p>Alkanes交易构建在比特币网络之上，使用特殊的交易结构来执行智能合约功能，并使用Diesel代币作为交易Gas费。</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">如何查询我的Diesel余额？</h3>
              <p>您可以使用我们的<Link href="/diesel" className="text-blue-600 hover:underline">Diesel查询工具</Link>，输入您的BTC地址，查看对应的Diesel余额。</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">区块奖励如何分配？</h3>
              <p>每个区块中，一部分Diesel代币将作为奖励分配给矿工或验证者，这部分占总量的50%，随着时间推移逐渐释放。</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Gas费率如何影响交易成功率？</h3>
              <p>较高的Gas费率能提高交易被打包的优先级，特别是在网络拥堵时。对于铸造交易，合理的Gas费率可以提高成功率，但也需要平衡成本。</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 