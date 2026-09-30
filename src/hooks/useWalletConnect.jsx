import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { SEPOLIA_CHAIN_ID, SUPPORTED_CHAINS } from "../constants";

export const useWalletConnection = () => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const accountRef = useRef("");
  const chainIdRef = useRef(null);
  const balanceRequestId = useRef(0);

  const loadBalance = useCallback(
    async (walletProvider, targetAccount, targetChainId) => {
      const requestId = ++balanceRequestId.current;
      if (!walletProvider) {
        setBalance("");
        setIsRefreshing(false);
        setError("No wallet provider selected.");
        return;
      }
      if (!targetAccount) {
        setBalance("");
        setIsRefreshing(false);
        setError("No wallet account connected.");
        return;
      }
      if (!SUPPORTED_CHAINS[targetChainId]) {
        setBalance("");
        setIsRefreshing(false);
        setError(
          `Unsupported chain detected: ${targetChainId}. Please switch to a supported network.`,
        );
        return;
      }

      setIsRefreshing(true);
      try {
        const ethersProvider = new BrowserProvider(walletProvider);
        const balanceInWei = await ethersProvider.getBalance(targetAccount);
        if (
          requestId === balanceRequestId.current &&
          accountRef.current === targetAccount &&
          chainIdRef.current === targetChainId
        ) {
          setBalance(formatEther(balanceInWei));
          setError("");
        }
      } catch (loadError) {
        if (requestId === balanceRequestId.current) {
          setBalance("");
          setError(loadError.message || "Failed to fetch balance.");
        }
      } finally {
        if (requestId === balanceRequestId.current) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  const connectWallet = useCallback(
    async (walletProvider) => {
      try {
        if (!walletProvider) {
          throw new Error("No wallet provider selected.");
        }

        setError("");
        setProvider(walletProvider);
        const accounts = await walletProvider.request({
          method: "eth_requestAccounts",
        });
        const chainIdHex = await walletProvider.request({
          method: "eth_chainId",
        });
        const numericChainId = Number.parseInt(chainIdHex, 16);
        const connectedAccount = accounts[0] || "";

        accountRef.current = connectedAccount;
        chainIdRef.current = numericChainId;
        setAccount(connectedAccount);
        setChainId(numericChainId);

        if (!connectedAccount) {
          setBalance("");
          return;
        }

        await loadBalance(walletProvider, connectedAccount, numericChainId);
      } catch (connectError) {
        setError(connectError.message || "Failed to connect wallet.");
      }
    },
    [loadBalance],
  );

  const disconnectWallet = useCallback(() => {
    balanceRequestId.current += 1;
    accountRef.current = "";
    chainIdRef.current = null;
    setAccount("");
    setChainId(null);
    setBalance("");
    setProvider(null);
    setError("");
    setIsRefreshing(false);
  }, []);

  const refreshBalance = useCallback(() => {
    return loadBalance(provider, accountRef.current, chainIdRef.current);
  }, [loadBalance, provider]);

  const switchToSepolia = useCallback(async () => {
    if (!provider) {
      setError("No wallet provider selected.");
      return;
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      setError(switchError.message || "Failed to switch to Sepolia.");
    }
  }, [provider]);

  useEffect(() => {
    if (!provider) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      const nextAccount = accounts[0] || "";
      accountRef.current = nextAccount;
      setAccount(nextAccount);

      if (!nextAccount) {
        balanceRequestId.current += 1;
        setBalance("");
        setIsRefreshing(false);
        return;
      }

      void loadBalance(provider, nextAccount, chainIdRef.current);
    };

    const handleChainChanged = (newChainId) => {
      const numericChainId = Number.parseInt(newChainId, 16);
      chainIdRef.current = numericChainId;
      setChainId(numericChainId);

      if (!SUPPORTED_CHAINS[numericChainId]) {
        balanceRequestId.current += 1;
        setIsRefreshing(false);
        setBalance("");
        setError(
          `Unsupported chain detected: ${numericChainId}. Please switch to a supported network.`,
        );
        return;
      }

      setError("");
      if (accountRef.current) {
        void loadBalance(provider, accountRef.current, numericChainId);
      }
    };

    const handleDisconnect = () => disconnectWallet();

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
      provider.removeListener?.("disconnect", handleDisconnect);
    };
  }, [provider, loadBalance, disconnectWallet]);

  return {
    account,
    provider,
    balance,
    chainId,
    error,
    isRefreshing,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    switchToSepolia,
  };
};
