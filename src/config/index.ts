import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

export const websiteConfig = {
  title: 'AppKit Dapp',
};

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'; // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [mainnet, arbitrum] as [AppKitNetwork, ...AppKitNetwork[]];

// 支持的链ID列表
export const SUPPORTED_CHAIN_IDS = networks.map(network => Number(network.id));

/**
 * 检查是否为支持的链
 * @param chainId 链ID
 * @returns 是否支持该链
 */
export const isSupportedChain = (chainId: number): boolean => {
  return networks.map(network => Number(network.id)).includes(chainId);
};

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
