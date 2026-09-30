import { useEffect, useState } from "react";
import { EIP6963AnnounceProvider, EIP6963RequestProvider } from "./constants";
import ConnectButton from "./components/ConnectButton";

const Eip6963 = () => {
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    const handleAnnounceProvider = (event) => {
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

    window.addEventListener(EIP6963AnnounceProvider, handleAnnounceProvider);
    window.dispatchEvent(new Event(EIP6963RequestProvider));

    return () => {
      window.removeEventListener(
        EIP6963AnnounceProvider,
        handleAnnounceProvider,
      );
    };
  }, []);

  return (
    <main className="wallet-app">
      <header className="app-header">
        <span className="eyebrow">EIP-6963 / EIP-1193</span>
        <h1>Wallet connection</h1>
      </header>
      <ConnectButton wallets={providers} />
    </main>
  );
};

export default Eip6963;
