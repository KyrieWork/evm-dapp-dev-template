import { createPublicClient, http } from 'viem';
import { bsc, localhost, mainnet } from '@reown/appkit/networks';
import { logError } from '@/utils';

export const getPublicClientForChain = (chainId: number) => {
  switch (chainId) {
    case Number(localhost.id):
      return createPublicClient({
        chain: localhost,
        transport: http('http://127.0.0.1:8545'),
      });
    case Number(bsc.id):
      return createPublicClient({
        chain: bsc,
        transport: http(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org'),
      });
    default:
      return null;
  }
};
