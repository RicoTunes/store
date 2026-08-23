import { createContext, useContext, type ReactNode } from 'react';

type WalletCtx = {
  address: string;
  mnemonic: string;
  balanceEth: string | null;
  busy: boolean;
  error: string;
  createWallet: () => Promise<void>;
  importMnemonic: (phrase: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearWallet: () => void;
  copyAddress: () => Promise<void>;
};

const stub: WalletCtx = {
  address: '',
  mnemonic: '',
  balanceEth: null,
  busy: false,
  error: '',
  async createWallet() {},
  async importMnemonic() {},
  async refreshBalance() {},
  clearWallet() {},
  async copyAddress() {},
};

const WalletContext = createContext<WalletCtx>(stub);

export function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContext.Provider value={stub}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
