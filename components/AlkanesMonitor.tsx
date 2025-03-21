import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Spinner, 
  Badge, 
  Table, 
  Thead, 
  Tbody,
  Tr,
  Th, 
  Td,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import axios from 'axios';

// 定义类型
interface AlkanesTx {
  txid: string;
  time: number;
  fee?: number;
  feeRate?: number;
  from?: string;
  gas?: number;
  contractId?: string;
  isRbf?: boolean;
}

interface BlockDetails {
  blockHeight: number;
  blockHash: string;
  blockTime: number;
  txCount: number;
  alkanesTxCount: number;
  alkanesBids: any[];
  alkanesTransactions: AlkanesTx[];
  rbfTransactions?: AlkanesTx[];
}

interface AddressDetails {
  address: string;
  balance: number;
  txCount: number;
  alkanesTransactions: AlkanesTx[];
}

const AlkanesMonitor: React.FC = () => {
  // 状态管理
  const [latestBlock, setLatestBlock] = useState<BlockDetails | null>(null);
  const [addressData, setAddressData] = useState<AddressDetails | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('purple.100', 'purple.700');
  
  // 获取最新区块数据
  const fetchLatestBlockData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/recent-alkanes-txs');
      setLatestBlock(response.data);
    } catch (err: any) {
      console.error('获取区块数据失败:', err);
      setError('获取最新区块数据失败，请稍后重试');
      toast({
        title: '获取数据失败',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 按地址搜索
  const searchByAddress = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: '请输入地址',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/address-monitor?address=${searchAddress}`);
      setAddressData(response.data);
    } catch (err: any) {
      console.error('获取地址数据失败:', err);
      setError('查询地址数据失败，请检查地址是否正确或稍后重试');
      toast({
        title: '获取地址数据失败',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 获取Alkanes统计数据
  const fetchAlkanesStats = async () => {
    try {
      const response = await axios.get('/api/alkanes-stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('获取统计数据失败:', err);
      toast({
        title: '获取统计数据失败',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // 格式化交易ID (缩短显示)
  const formatTxid = (txid: string): string => {
    return `${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`;
  };
  
  // 切换自动刷新
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // 关闭自动刷新
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } else {
      // 开启自动刷新，每30秒刷新一次
      const interval = setInterval(() => {
        fetchLatestBlockData();
        fetchAlkanesStats();
      }, 30000);
      setRefreshInterval(interval);
    }
    
    setAutoRefresh(!autoRefresh);
    toast({
      title: `自动刷新已${!autoRefresh ? '开启' : '关闭'}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 渲染RBF交易表格
  const renderRbfMonitor = () => {
    if (!latestBlock || !latestBlock.rbfTransactions || latestBlock.rbfTransactions.length === 0) {
      return (
        <Alert status="info">
          <AlertIcon />
          当前区块中未检测到RBF交易
        </Alert>
      );
    }

    return (
      <Box>
        <Heading size="md" mb={3}>RBF 交易 (按Gas费从高到低排序)</Heading>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>交易ID</Th>
              <Th>时间</Th>
              <Th>发送方</Th>
              <Th isNumeric>Gas (sat/vB)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {latestBlock.rbfTransactions.map((tx) => (
              <Tr key={tx.txid} bg={tx === latestBlock.rbfTransactions[0] ? highlightColor : undefined}>
                <Td>
                  <a 
                    href={`https://mempool.space/tx/${tx.txid}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {formatTxid(tx.txid)}
                  </a>
                  {tx === latestBlock.rbfTransactions[0] && (
                    <Badge ml={2} colorScheme="green">领先</Badge>
                  )}
                </Td>
                <Td>{formatTimestamp(tx.time)}</Td>
                <Td>{tx.from || '未知'}</Td>
                <Td isNumeric fontWeight="bold">{tx.gas || 0}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  };
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchLatestBlockData();
    fetchAlkanesStats();
    
    return () => {
      // 组件卸载时清除定时器
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Alkanes 协议监控</Heading>
          <HStack>
            <Button 
              leftIcon={<RepeatIcon />} 
              colorScheme={autoRefresh ? "green" : "gray"} 
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? "自动刷新中" : "自动刷新"}
            </Button>
            <Button 
              isLoading={loading} 
              onClick={() => {
                fetchLatestBlockData();
                fetchAlkanesStats();
              }}
            >
              刷新数据
            </Button>
          </HStack>
        </HStack>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab>当前区块</Tab>
            <Tab>RBF</Tab>
            <Tab>地址监控</Tab>
            <Tab>协议统计</Tab>
          </TabList>
          
          <TabPanels>
            {/* 当前区块面板 */}
            <TabPanel>
              <Box 
                borderWidth="1px" 
                borderRadius="lg" 
                p={4}
                bg={bgColor}
                borderColor={borderColor}
                boxShadow="sm"
              >
                {loading ? (
                  <Flex justify="center" align="center" p={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : latestBlock ? (
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={8} wrap="wrap">
                      <Stat>
                        <StatLabel>区块高度</StatLabel>
                        <StatNumber>{latestBlock.blockHeight}</StatNumber>
                        <StatHelpText>
                          时间：{formatTimestamp(latestBlock.blockTime)}
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>总交易数</StatLabel>
                        <StatNumber>{latestBlock.txCount}</StatNumber>
                        <StatHelpText>
                          Alkanes交易：{latestBlock.alkanesTxCount || latestBlock.alkanesTransactions.length}
                        </StatHelpText>
                      </Stat>
                    </HStack>
                    
                    <Box>
                      <Heading size="md" mb={3}>Alkanes 交易 (按Gas费从高到低排序)</Heading>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>交易ID</Th>
                            <Th>时间</Th>
                            <Th>发送方</Th>
                            <Th isNumeric>Gas (sat/vB)</Th>
                            <Th>合约ID</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {latestBlock.alkanesTransactions.map((tx) => (
                            <Tr 
                              key={tx.txid} 
                            >
                              <Td>
                                <a 
                                  href={`https://mempool.space/tx/${tx.txid}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {formatTxid(tx.txid)}
                                </a>
                              </Td>
                              <Td>{formatTimestamp(tx.time)}</Td>
                              <Td>{tx.from || '未知'}</Td>
                              <Td isNumeric fontWeight="bold">{tx.gas || 0}</Td>
                              <Td>{tx.contractId ? formatTxid(tx.contractId) : '无'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                ) : (
                  <Text>无数据可显示</Text>
                )}
              </Box>
            </TabPanel>
            
            {/* RBF监控面板 */}
            <TabPanel>
              <Box 
                borderWidth="1px" 
                borderRadius="lg" 
                p={4}
                bg={bgColor}
                borderColor={borderColor}
                boxShadow="sm"
              >
                {loading ? (
                  <Flex justify="center" align="center" p={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Heading size="md" mb={3}>RBF说明</Heading>
                        <Text mb={3}>
                          RBF（Replace-By-Fee）交易指用户通过提高Gas费用来竞争成为区块中第一个被确认的Alkanes交易，从而获得铸造Diesel代币的权利。
                          只有区块中第一个确认的Alkanes交易才能获得Diesel奖励。
                        </Text>
                      </Box>
                      
                      {latestBlock && latestBlock.blockHeight && (
                        <Stat>
                          <StatLabel>当前区块</StatLabel>
                          <StatNumber>{latestBlock.blockHeight}</StatNumber>
                          <StatHelpText>
                            时间：{formatTimestamp(latestBlock.blockTime)}
                          </StatHelpText>
                        </Stat>
                      )}
                      
                      {renderRbfMonitor()}
                    </VStack>
                  </>
                )}
              </Box>
            </TabPanel>
            
            {/* 地址监控面板 */}
            <TabPanel>
              {/* 搜索框 */}
              <InputGroup size="md" mb={4}>
                <Input 
                  placeholder="输入Bitcoin地址" 
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchByAddress();
                    }
                  }}
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={searchByAddress} isLoading={loading}>
                    <SearchIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              {/* 地址详情 */}
              {addressData && (
                <Box 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  p={4}
                  bg={bgColor}
                  borderColor={borderColor}
                  boxShadow="sm"
                >
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={8} wrap="wrap">
                      <Stat>
                        <StatLabel>地址</StatLabel>
                        <StatNumber fontSize="md">{addressData.address}</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>BTC余额</StatLabel>
                        <StatNumber>{addressData.balance} BTC</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>交易总数</StatLabel>
                        <StatNumber>{addressData.txCount}</StatNumber>
                      </Stat>
                    </HStack>
                    
                    {addressData.alkanesTransactions && addressData.alkanesTransactions.length > 0 ? (
                      <Box>
                        <Heading size="md" mb={3}>Alkanes 相关交易</Heading>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>交易ID</Th>
                              <Th>时间</Th>
                              <Th isNumeric>Gas (sat/vB)</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {addressData.alkanesTransactions.map((tx) => (
                              <Tr 
                                key={tx.txid}
                              >
                                <Td>
                                  <a 
                                    href={`https://mempool.space/tx/${tx.txid}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {formatTxid(tx.txid)}
                                  </a>
                                </Td>
                                <Td>{formatTimestamp(tx.time)}</Td>
                                <Td isNumeric>{tx.gas || 0}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        该地址没有Alkanes相关交易
                      </Alert>
                    )}
                  </VStack>
                </Box>
              )}
            </TabPanel>
            
            {/* 协议统计面板 */}
            <TabPanel>
              <Box 
                borderWidth="1px" 
                borderRadius="lg" 
                p={4}
                bg={bgColor}
                borderColor={borderColor}
                boxShadow="sm"
              >
                {loading || !stats ? (
                  <Flex justify="center" align="center" p={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">协议整体统计</Heading>
                    
                    <HStack spacing={8} wrap="wrap">
                      <Stat>
                        <StatLabel>当前区块高度</StatLabel>
                        <StatNumber>{stats.currentBlock}</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>总Alkanes交易</StatLabel>
                        <StatNumber>{stats.summary.totalAlkanesTransactions}</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>平均Gas (sat/vB)</StatLabel>
                        <StatNumber>{stats.summary.averageGasPerTransaction}</StatNumber>
                      </Stat>
                    </HStack>
                    
                    <Box>
                      <Heading size="sm" mb={2}>最近区块Alkanes活动</Heading>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>区块高度</Th>
                            <Th>时间</Th>
                            <Th isNumeric>交易数</Th>
                            <Th isNumeric>Alkanes交易</Th>
                            <Th isNumeric>Gas用量</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {stats.recentBlocks.slice(0, 10).map((block: any) => (
                            <Tr key={block.height}>
                              <Td>{block.height}</Td>
                              <Td>{formatTimestamp(block.time)}</Td>
                              <Td isNumeric>{block.txCount}</Td>
                              <Td isNumeric>{block.alkanesTxCount}</Td>
                              <Td isNumeric>{block.gasUsed.toFixed(2)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default AlkanesMonitor; 