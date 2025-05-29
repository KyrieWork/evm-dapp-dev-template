import { type Address, type WalletClient, formatUnits, getContract } from 'viem';
import { logError } from '@/utils';
import { ABI_ERC20 } from './abis';
import { useChainId } from 'wagmi';
import { getPublicClientForChain } from './client';

export const useERC20 = (walletClient?: WalletClient) => {
  const chainId = useChainId();
  const client = getPublicClientForChain(chainId);

  const tokenContract = async (token: Address) => {
    return getContract({
      address: token,
      abi: ABI_ERC20,
      client,
    });
  };

  const tokenContractForWallet = async (token: Address) => {
    return getContract({
      address: token,
      abi: ABI_ERC20,
      client: walletClient!,
    });
  };

  const accountTokenInfo = async (token: Address, account: Address) => {
    try {
      const contract = await tokenContract(token);
      const name = (await contract.read.name()) as string;
      const symbol = (await contract.read.symbol()) as string;
      const decimals = (await contract.read.decimals()) as number;
      const balance = (await contract.read.balanceOf([account])) as bigint;

      const uiAmount = formatUnits(balance, decimals);
      return { name, symbol, decimals, balance, uiAmount };
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };

  const tokenMetadata = async (token: Address) => {
    try {
      const contract = await tokenContract(token);
      const name = (await contract.read.name()) as string;
      const symbol = (await contract.read.symbol()) as string;
      const decimals = (await contract.read.decimals()) as number;
      return { name, symbol, decimals };
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };
  const tokenBalance = async (token: Address, account: Address) => {
    try {
      const contract = await tokenContract(token);
      const balance = (await contract.read.balanceOf([account])) as bigint;
      return balance;
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };
  const tokenAllowance = async (token: Address, account: Address, spender: Address) => {
    try {
      const contract = await tokenContract(token);
      const allowance = (await contract.read.allowance([account, spender])) as bigint;
      return allowance;
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };
  const tokenApprove = async (token: Address, spender: Address, amount: bigint) => {
    try {
      const contract = await tokenContractForWallet(token);
      const tx = await contract.write.approve([spender, amount]);
      return tx;
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };
  const tokenTransfer = async (token: Address, to: Address, amount: bigint) => {
    try {
      const contract = await tokenContractForWallet(token);
      const tx = await contract.write.transfer([to, amount]);
      return tx;
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };
  const tokenTransferFrom = async (token: Address, from: Address, to: Address, amount: bigint) => {
    try {
      const contract = await tokenContractForWallet(token);
      const tx = await contract.write.transferFrom([from, to, amount]);
      return tx;
    } catch (error) {
      logError(`[useErc20]`, error);
    }
  };

  return {
    accountTokenInfo,
    tokenMetadata,
    tokenBalance,
    tokenAllowance,
    tokenApprove,
    tokenTransfer,
    tokenTransferFrom,
  };
};
