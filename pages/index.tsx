import React, { useEffect, useState } from 'react';
import { 
  getBlockCount, 
  getRecentBlocks, 
  getHighestGasForAlkanes, 
  getCurrentBlockAlkanesTxs,
  monitorNextBlockMintingWindow,
  getDieselBalance
} from '../lib/api';
import Link from 'next/link';
import { formatTimestamp } from '../lib/utils';
import Head from 'next/head';
import AlkanesMonitor from '../components/AlkanesMonitor';

export default function Home() {
  return (
    <>
      <Head>
        <title>Alkanes Explorer - 比特币Alkanes协议监控工具</title>
        <meta name="description" content="Alkanes Protocol Explorer - 监控比特币链上的Alkanes协议活动，包括交易、合约和Gas费用" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <AlkanesMonitor />
      </main>
    </>
  );
} 