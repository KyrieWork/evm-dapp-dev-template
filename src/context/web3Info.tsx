'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Address } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import { useERC20 } from '@/web3';
import { logDebug, logError } from '@/utils';
import { getTokenBySymbol } from '@/config/tokens';

interface Web3InfoContextType {
  user: Address | undefined;
  usdtUiBalance: string;
}

const Web3InfoContext = createContext<Web3InfoContextType | null>(null);

export const Web3InfoProvider = ({ children }: { children: ReactNode }) => {
  const chainId = useChainId();
  const { address } = useAccount();
  const { accountTokenInfo } = useERC20();
  const [usdtUiBalance, setUsdtUiBalance] = useState<string>('0');

  useEffect(() => {
    if (address && chainId) {
      const usdtAddress = getTokenBySymbol(chainId, 'USDT')?.address;
      if (!usdtAddress) {
        logError('USDT address not found');
        return;
      }
      accountTokenInfo(usdtAddress!, address).then(data => {
        if (data) {
          logDebug('accountTokenInfo data:', data);
          setUsdtUiBalance(data.uiAmount);
        }
      });
    }
  }, [address, chainId]);

  return (
    <Web3InfoContext.Provider value={{ user: address, usdtUiBalance }}>
      {children}
    </Web3InfoContext.Provider>
  );
};

export const useWeb3Info = () => {
  const context = useContext(Web3InfoContext);
  if (!context) {
    throw new Error('useWeb3Info must be used within a Web3InfoProvider');
  }
  return context;
};
