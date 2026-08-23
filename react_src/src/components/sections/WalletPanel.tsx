import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/contexts/WalletContext';
import { INTENT } from '@/config/site';

export function WalletPanel({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const {
    address,
    mnemonic,
    balanceEth,
    busy,
    error,
    createWallet,
    importMnemonic,
    refreshBalance,
    clearWallet,
    copyAddress,
  } = useWallet();
  const [importValue, setImportValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const pd = ((INTENT as any).productDesign && typeof (INTENT as any).productDesign === 'object')
    ? ((INTENT as any).productDesign as Record<string, string>)
    : {};
  const walletChrome = String(pd.wallet_chrome || 'connected');
  const chromeClass =
    walletChrome === 'prominent' ? 'ring-2 ring-primary'
    : walletChrome === 'minimal' ? 'ring-0 shadow-none'
    : 'ring-1 ring-black/5';

  useEffect(() => {
    if (address) void refreshBalance();
  }, [address, refreshBalance]);

  return (
    <section id={id} className={`border-b border-black/5 py-16 md:py-20 pd-wallet--${walletChrome}`}>
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Non-custodial</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        <p className="mt-3 max-w-2xl rounded-md bg-primary/10 px-3 py-2 text-sm text-ink">
          Keys are generated in your browser with secp256k1. Dwene never stores your seed or private key on the server.
        </p>

        {!address ? (
          <div className={`mt-8 grid gap-4 md:grid-cols-2 ${walletChrome === 'prominent' ? 'md:grid-cols-1 max-w-xl' : ''}`}>
            <div className={`rounded-[var(--radius-md)] bg-surface p-6 ${chromeClass}`}>
              <h3 className="font-semibold text-ink">Create wallet</h3>
              <p className="mt-2 text-sm text-muted">Generate a real Ethereum address and recovery phrase.</p>
              <Button className="mt-4" disabled={busy} onClick={() => void createWallet()}>
                {busy ? 'Creating…' : 'Create real wallet'}
              </Button>
            </div>
            <div className={`rounded-[var(--radius-md)] bg-surface p-6 ${chromeClass}`}>
              <h3 className="font-semibold text-ink">Import recovery phrase</h3>
              <textarea
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                rows={3}
                placeholder="twelve or twenty-four words"
                className="mt-3 w-full rounded-md border border-black/10 bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button
                className="mt-4"
                variant="outline"
                disabled={busy || !importValue.trim()}
                onClick={() => void importMnemonic(importValue.trim())}
              >
                Import
              </Button>
            </div>
          </div>
        ) : (
          <div className={`mt-8 space-y-4 rounded-[var(--radius-md)] bg-surface p-6 ${chromeClass}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receive address</p>
              <p className="mt-1 break-all font-mono text-sm text-ink">{address}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void copyAddress()}>Copy address</Button>
                <Button variant="outline" onClick={() => void refreshBalance()} disabled={busy}>
                  Refresh balance
                </Button>
                <Button variant="ghost" onClick={() => clearWallet()}>Remove from this device</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Balance (ETH mainnet, read-only RPC)</p>
              <p className="mt-1 font-display text-2xl font-semibold text-primary">
                {balanceEth == null ? '—' : `${balanceEth} ETH`}
              </p>
            </div>
            {mnemonic ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-ink">Save this recovery phrase offline</p>
                <p className="mt-1 text-xs text-muted">Shown once after create. Anyone with these words controls the wallet.</p>
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-primary"
                  onClick={() => setRevealed((v) => !v)}
                >
                  {revealed ? 'Hide phrase' : 'Reveal phrase'}
                </button>
                {revealed ? (
                  <p className="mt-2 break-words font-mono text-sm text-ink">{mnemonic}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Container>
    </section>
  );
}
