import { Address } from 'viem';

export interface TokenInfo {
  address: Address;
  decimals: number;
  balance?: bigint;
  name?: string;
  symbol?: string;
  uiAmount?: string;
}
