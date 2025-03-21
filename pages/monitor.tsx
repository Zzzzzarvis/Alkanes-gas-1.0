import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  getHighestGasForAlkanes, 
  monitorNextBlockMintingWindow,
  monitorAlkanesGasAndSubmitTx,
  getBlockCount
} from '../lib/api';
import { formatTimestamp } from '../lib/utils';

interface BlockStatus {
  height: number;
  time: number;
}

interface MonitorState {
  isMonitoring: boolean;
  currentHighestGas: number;
  optimalGas: number;
  address: string;
  privateKey: string;
  maxGasLimit: number;
  targetGasMultiplier: number;
  checkIntervalMs: number;
  logs: string[];
  lastSubmittedTx: any;
  mintingInfo: {
    estimatedTimeLeft: number;
    recommendedGas: number;
    competitorCount: number;
  };
  currentBlock: BlockStatus | null;
  rbfDetected: boolean;
  trackedTxCount: number;
  rbfTxCount: number;
  lastRbfInfo: string | null;
}

export default function MonitorPage() {
  const initialState: MonitorState = {
    isMonitoring: false,
    currentHighestGas: 0,
    optimalGas: 0,
    address: '',
    privateKey: '',
    maxGasLimit: 50,
    targetGasMultiplier: 1.05,
    checkIntervalMs: 1500,
    logs: [],
    lastSubmittedTx: null,
    mintingInfo: {
      estimatedTimeLeft: 0,
      recommendedGas: 0,
      competitorCount: 0
    },
    currentBlock: null,
    rbfDetected: false,
    trackedTxCount: 0,
    rbfTxCount: 0,
    lastRbfInfo: null
  };

  const [state, setState] = useState<MonitorState>(initialState);
  const monitorControlRef = useRef<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    setState(prevState => ({
      ...prevState,
      logs: [...prevState.logs.slice(-100), logMessage]
    }));
  };

  // 滚动日志到底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs]);

  // 获取当前区块高度
  useEffect(() => {
    const fetchBlockHeight = async () => {
      try {
        const height = await getBlockCount();
        setState(prevState => ({
          ...prevState,
          currentBlock: {
            height,
            time: Date.now()
          }
        }));
      } catch (error) {
        console.error('获取区块高度失败:', error);
        addLog('获取区块高度失败: ' + (error as Error).message);
      }
    };

    fetchBlockHeight();
    const interval = setInterval(fetchBlockHeight, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  }, []);

  // 启动监控
  const startMonitoring = async () => {
    if (!state.address) {
      addLog('错误: 请输入地址');
      return;
    }

    if (!state.privateKey) {
      addLog('错误: 请输入私钥');
      return;
    }

    try {
      addLog('正在启动Alkanes Gas监控...');
      
      // 获取初始数据
      const [currentHighestGas, mintingInfo] = await Promise.all([
        getHighestGasForAlkanes(),
        monitorNextBlockMintingWindow()
      ]);
      
      setState(prevState => ({
        ...prevState,
        isMonitoring: true,
        currentHighestGas,
        mintingInfo,
        optimalGas: Math.min(
          Math.ceil(currentHighestGas * state.targetGasMultiplier),
          state.maxGasLimit
        )
      }));
      
      addLog(`初始最高Gas: ${currentHighestGas}, 建议Gas: ${state.optimalGas}`);
      
      // 启动持续监控
      monitorControlRef.current = await monitorAlkanesGasAndSubmitTx({
        address: state.address,
        privateKey: state.privateKey,
        maxGasLimit: state.maxGasLimit,
        targetGasMultiplier: state.targetGasMultiplier,
        checkIntervalMs: state.checkIntervalMs,
        onStatusUpdate: (status) => {
          setState(prevState => ({
            ...prevState,
            currentHighestGas: status.currentHighestGas,
            optimalGas: status.optimalGas,
            mintingInfo: status.mintingInfo,
            lastSubmittedTx: status.lastSubmittedTx,
            // 更新RBF相关信息
            rbfDetected: status.rbfDetected || false,
            trackedTxCount: status.trackedTxCount || 0,
            rbfTxCount: status.rbfTxCount || 0
          }));
          
          // 记录RBF检测信息
          if (status.rbfDetected && !state.rbfDetected) {
            addLog(`检测到RBF交易! 当前追踪的RBF交易数: ${status.rbfTxCount || 0}`);
            setState(prevState => ({
              ...prevState,
              lastRbfInfo: `检测到RBF交易 (${new Date().toLocaleTimeString()})`
            }));
          }
          
          // 记录Gas变化
          if (Math.abs(status.currentHighestGas - state.currentHighestGas) >= 0.5) {
            addLog(`Gas变化: ${state.currentHighestGas.toFixed(2)} -> ${status.currentHighestGas.toFixed(2)} sat/vB`);
          }
        },
        enabled: true
      });
      
      addLog('监控已启动, 等待最佳铸造时机');
    } catch (error) {
      console.error('启动监控失败:', error);
      addLog('启动监控失败: ' + (error as Error).message);
      setState(prevState => ({ ...prevState, isMonitoring: false }));
    }
  };

  // 停止监控
  const stopMonitoring = () => {
    if (monitorControlRef.current) {
      monitorControlRef.current.stopMonitoring();
      monitorControlRef.current = null;
    }
    
    setState(prevState => ({
      ...prevState,
      isMonitoring: false
    }));
    
    addLog('监控已停止');
  };

  // 更新设置
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    
    setState(prevState => ({
      ...prevState,
      [name]: parsedValue
    }));
  };

  // 清空日志
  const clearLogs = () => {
    setState(prevState => ({
      ...prevState,
      logs: []
    }));
  };

  return (
    <Layout title="Alkanes Diesel 监控">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Alkanes Diesel 自动铸造</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧面板 - 监控控制 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">监控控制</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    钱包地址
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={state.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="输入您的BTC地址"
                    disabled={state.isMonitoring}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    私钥 (用于签名交易)
                  </label>
                  <input
                    type="password"
                    name="privateKey"
                    value={state.privateKey}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="输入私钥"
                    disabled={state.isMonitoring}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    私钥仅在本地用于签名，不会发送到服务器
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大Gas限制 (sat/vB)
                  </label>
                  <input
                    type="number"
                    name="maxGasLimit"
                    value={state.maxGasLimit}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    disabled={state.isMonitoring}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目标Gas倍数
                  </label>
                  <input
                    type="number"
                    name="targetGasMultiplier"
                    value={state.targetGasMultiplier}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    step="0.01"
                    disabled={state.isMonitoring}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    相对于当前最高Gas的倍数，例如1.05表示高5%
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    检查间隔 (毫秒)
                  </label>
                  <input
                    type="number"
                    name="checkIntervalMs"
                    value={state.checkIntervalMs}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1000"
                    step="1000"
                    disabled={state.isMonitoring}
                  />
                </div>
                
                <div className="pt-4 flex space-x-2">
                  {!state.isMonitoring ? (
                    <button
                      onClick={startMonitoring}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      启动监控
                    </button>
                  ) : (
                    <button
                      onClick={stopMonitoring}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      停止监控
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 中间面板 - 监控状态 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">监控状态</h2>
              
              <div className="space-y-4">
                <div>
                  <span className="text-gray-700">当前区块高度:</span>
                  <span className="float-right font-semibold">
                    {state.currentBlock?.height || '加载中...'}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-700">更新时间:</span>
                  <span className="float-right font-semibold">
                    {state.currentBlock ? formatTimestamp(state.currentBlock.time / 1000) : '加载中...'}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-700">当前Alkanes最高Gas:</span>
                  <span className="float-right font-semibold">
                    {state.currentHighestGas} sat/vB
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-700">计算的最优Gas:</span>
                  <span className="float-right font-semibold">
                    {state.optimalGas} sat/vB
                  </span>
                </div>
                
                {/* 添加RBF相关信息 */}
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <h3 className="text-lg font-semibold mb-2">RBF交易监控</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-700">追踪交易总数:</span>
                      <span className="float-right font-semibold">
                        {state.trackedTxCount}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-700">RBF交易数量:</span>
                      <span className={`float-right font-semibold ${state.rbfTxCount > 0 ? 'text-orange-500' : ''}`}>
                        {state.rbfTxCount}
                      </span>
                    </div>
                    
                    {state.lastRbfInfo && (
                      <div>
                        <span className="text-gray-700">最近RBF检测:</span>
                        <span className="float-right font-semibold text-orange-500">
                          {state.lastRbfInfo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-2">铸造窗口信息</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-700">预计剩余时间:</span>
                      <span className="float-right font-semibold">
                        {state.mintingInfo.estimatedTimeLeft} 秒
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-700">建议Gas:</span>
                      <span className="float-right font-semibold">
                        {state.mintingInfo.recommendedGas} sat/vB
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-700">竞争者数量:</span>
                      <span className="float-right font-semibold">
                        {state.mintingInfo.competitorCount}
                      </span>
                    </div>
                  </div>
                </div>
                
                {state.lastSubmittedTx && (
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-2">最近提交的交易</h3>
                    
                    <div className="bg-gray-100 p-3 rounded-md">
                      <div className="text-sm">
                        <div><strong>时间:</strong> {state.lastSubmittedTx.timestamp}</div>
                        <div><strong>Gas:</strong> {state.lastSubmittedTx.gas} sat/vB</div>
                        <div><strong>地址:</strong> {state.lastSubmittedTx.from.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧面板 - 日志 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">监控日志</h2>
                <button 
                  onClick={clearLogs}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-md p-3 h-96 overflow-y-auto">
                {state.logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    暂无日志
                  </div>
                ) : (
                  <div className="space-y-1 text-sm font-mono">
                    {state.logs.map((log, index) => (
                      <div key={index} className="break-all">{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 