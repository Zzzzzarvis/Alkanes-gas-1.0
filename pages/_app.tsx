import { AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import '../styles/globals.css';

// 定义全局fetcher函数
const fetcher = (url: string) => axios.get(url).then(res => res.data);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <SWRConfig value={{ fetcher, refreshInterval: 10000 }}>
        <Component {...pageProps} />
      </SWRConfig>
    </ChakraProvider>
  );
}

export default MyApp; 