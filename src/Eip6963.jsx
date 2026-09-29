import { useEffect, useState } from "react";

// Supported chains
const SUPPORTED_CHAINS = {
  1: "Ethereum Mainnet",
  11155111: "Ethereum Sepolia",
};

const Eip6963 = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // EIP-6963: Discover available wallets
  // --------------------------------------------------
  useEffect(() => {
    const handleAnnounceProvider = (event) => {
      console.log("Provider:", event.detail);

      setProviders((currentProviders) => {
        const providerAlreadyExists = currentProviders.some(
          (provider) => provider.info.uuid === event.detail.info.uuid,
        );

        if (providerAlreadyExists) {
          return currentProviders;
        }

        return [...currentProviders, event.detail];
      });
    };

    // Listen for wallets announcing themselves
    window.addEventListener("eip6963:announceProvider", handleAnnounceProvider);

    // Ask installed wallets to announce themselves
    const requestEvent = new Event("eip6963:requestProvider");

    window.dispatchEvent(requestEvent);

    // Cleanup listener
    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider,
      );
    };
  }, []);

  // --------------------------------------------------
  // Check if chain is supported
  // --------------------------------------------------
  const checkSupportedChain = (chainId) => {
    const numericChainId = parseInt(chainId, 16);

    setChainId(numericChainId);

    if (!SUPPORTED_CHAINS[numericChainId]) {
      setError(`Unsupported chain detected: ${numericChainId}`);

      return false;
    }

    setError("");

    return true;
  };

  // --------------------------------------------------
  // Listen for account and chain changes
  // --------------------------------------------------
  useEffect(() => {
    if (!selectedProvider) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      console.log("Accounts Changed:", accounts);

      if (accounts.length === 0) {
        setAccount("");
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      console.log("Chain Changed:", parseInt(chainId, 16));

      checkSupportedChain(chainId);
    };

    const handleConnect = (connectInfo) => {
      console.log("Connected:", connectInfo);
    };

    selectedProvider.on("accountsChanged", handleAccountsChanged);

    selectedProvider.on("chainChanged", handleChainChanged);

    selectedProvider.on("connect", handleConnect);

    // Remove listeners when provider changes/unmounts
    return () => {
      if (selectedProvider.removeListener) {
        selectedProvider.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );

        selectedProvider.removeListener("chainChanged", handleChainChanged);

        selectedProvider.removeListener("connect", handleConnect);
      }
    };
  }, [selectedProvider]);

  // --------------------------------------------------
  // Connect wallet
  // --------------------------------------------------
  const handleConnectWallet = async (provider) => {
    try {
      if (!provider) {
        return;
      }

      setError("");
      setSelectedProvider(provider);

      // Request wallet account
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        setAccount("");
        return;
      }

      setAccount(accounts[0]);

      // Get current chain
      const chainId = await provider.request({
        method: "eth_chainId",
      });

      const numericChainId = parseInt(chainId, 16);

      setChainId(numericChainId);

      // Check supported chain
      if (!SUPPORTED_CHAINS[numericChainId]) {
        setError(`Unsupported chain detected: ${numericChainId}`);
      }
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to connect wallet");
    }
  };

  // --------------------------------------------------
  // Switch to supported chain
  // --------------------------------------------------
  const switchToSupportedChain = async () => {
    if (!selectedProvider) {
      return;
    }

    try {
      await selectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            // Ethereum Sepolia
            chainId: "0xaa36a7",
          },
        ],
      });

      setError("");
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to switch chain");
    }
  };

  // --------------------------------------------------
  // Disconnect
  // --------------------------------------------------
  const handleDisconnect = () => {
    setAccount("");
    setChainId(0);
    setSelectedProvider(null);
    setError("");

    console.log("Wallet disconnected");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>EIP-6963 Wallet Connection</h1>

      {/* -------------------------------------------- */}
      {/* Available Wallets */}
      {/* -------------------------------------------- */}

      <h2>Available Wallets</h2>

      {providers.length === 0 && <p>No wallet providers detected.</p>}

      {providers.map((provider) => (
        <div
          key={provider.info.uuid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <img
            src={provider.info.icon}
            alt={provider.info.name}
            width={50}
            height={50}
          />

          <p>{provider.info.name}</p>

          <button onClick={() => handleConnectWallet(provider.provider)}>
            Connect {provider.info.name}
          </button>
        </div>
      ))}

      {/* -------------------------------------------- */}
      {/* Error message */}
      {/* -------------------------------------------- */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid red",
          }}
        >
          <p>
            <strong>Error:</strong> {error}
          </p>

          {error.includes("Unsupported chain") && (
            <button onClick={switchToSupportedChain}>Switch to Sepolia</button>
          )}
        </div>
      )}

      {/* -------------------------------------------- */}
      {/* Connected Wallet Information */}
      {/* -------------------------------------------- */}

      {account && (
        <div style={{ marginTop: "30px" }}>
          <h2>Connected Wallet</h2>

          <p>
            <strong>Account:</strong>
          </p>

          <p>{account}</p>

          <p>
            <strong>Chain ID:</strong> {chainId}
          </p>

          <p>
            <strong>Network:</strong>{" "}
            {SUPPORTED_CHAINS[chainId] || "Unsupported Network"}
          </p>

          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default Eip6963;
