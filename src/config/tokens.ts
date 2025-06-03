import tokensData from './tokens.json';
import { TokenInfo } from '@/types/token';

// 本地Token接口，用于配置文件中的代币信息
interface ConfigToken {
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
  name?: string;
}

/**
 * 根据chainId获取代币列表
 * @param chainId 链ID
 * @returns 该链上的代币列表
 */
export const getTokensByChainId = (chainId: number): TokenInfo[] => {
  const chainIdStr = chainId.toString();
  const configTokens = (tokensData as Record<string, ConfigToken[]>)[chainIdStr] || [];

  // 转换为TokenInfo格式
  return configTokens.map(token => ({
    symbol: token.symbol,
    address: token.address as `0x${string}`,
    decimals: token.decimals,
    name: token.name,
    logoURI: token.logoURI,
  }));
};

/**
 * 根据链ID和代币符号获取特定代币
 * @param chainId 链ID
 * @param symbol 代币符号（不区分大小写）
 * @returns 找到的代币信息，没找到返回null
 */
export const getTokenBySymbol = (chainId: number, symbol: string): TokenInfo | null => {
  const tokens = getTokensByChainId(chainId);
  return tokens.find(token => token.symbol?.toUpperCase() === symbol.toUpperCase()) || null;
};

/**
 * 获取推荐的默认代币对
 * @param chainId 链ID
 * @returns 包含fromToken和toToken的对象
 */
export const getDefaultTokenPair = (
  chainId: number
): { fromToken: TokenInfo | null; toToken: TokenInfo | null } => {
  let fromToken: TokenInfo | null = null;
  let toToken: TokenInfo | null = null;

  switch (chainId) {
    case 1: // 以太坊主网
      fromToken = getTokenBySymbol(chainId, 'WETH');
      toToken = getTokenBySymbol(chainId, 'USDT');
      break;
    case 56: // BSC主网
    case 1337: // 本地测试网
      fromToken = getTokenBySymbol(chainId, 'WBNB');
      toToken = getTokenBySymbol(chainId, 'USDT');
      break;
    default: // 其他链
      const tokens = getTokensByChainId(chainId);
      if (tokens.length >= 2) {
        fromToken = tokens[0];
        toToken = tokens[1];
      }
      break;
  }

  return { fromToken, toToken };
};
