import { useWalletConnection } from "../hooks/useWalletConnect";

import { SUPPORTED_CHAINS } from "../constants";

const ConnectButton = ({ wallets }) => {
  const {
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
  } = useWalletConnection();

  const selectedWallet = wallets.find((wallet) => wallet.provider === provider);

  return (
    <section className="wallet-panel" aria-label="Wallet connection">
      {!account && (
        <div className="wallet-list">
          <h2>Available wallets</h2>
          {wallets.length === 0 ? (
            <p className="muted">No wallet providers detected.</p>
          ) : (
            wallets.map((wallet) => (
              <div className="wallet-option" key={wallet.info.uuid}>
                <img
                  src={wallet.info.icon || undefined}
                  alt=""
                  width="36"
                  height="36"
                />
                <span>{wallet.info.name}</span>
                <button onClick={() => connectWallet(wallet.provider)}>
                  Connect
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="wallet-error" role="alert">
          <p>{error}</p>
          {provider && error.includes("Unsupported chain") && (
            <button onClick={switchToSepolia}>Switch to Sepolia</button>
          )}
        </div>
      )}

      {account && (
        <div className="wallet-details">
          <div className="wallet-heading">
            <div>
              <h2>{selectedWallet?.info.name || "Connected wallet"}</h2>
              <p className="muted">{account}</p>
            </div>
            <button className="quiet-button" onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
          <dl className="wallet-facts">
            <div>
              <dt>Chain ID</dt>
              <dd>{chainId}</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>{SUPPORTED_CHAINS[chainId] || "Unsupported Network"}</dd>
            </div>
          </dl>
          {SUPPORTED_CHAINS[chainId] && (
            <div className="balance-row">
              <p>Balance: {balance === "" ? "--" : `${balance} ETH`}</p>
              <button onClick={refreshBalance} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh Balance"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ConnectButton;
