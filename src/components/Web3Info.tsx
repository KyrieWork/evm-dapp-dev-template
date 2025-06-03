'use client';

import { useWeb3Info } from '@/context/web3Info';

export const Web3Info = () => {
  const { user, usdtUiBalance } = useWeb3Info();

  return (
    <div>
      <div>User: {user}</div>
      <div>USDT Balance: {usdtUiBalance}</div>
    </div>
  );
};
