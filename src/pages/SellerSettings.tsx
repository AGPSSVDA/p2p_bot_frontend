import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Coins, TrendingDown, Activity, Hash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sellerService, OpenaiUsage } from '@/services/seller.service';
import { Skeleton } from '@/components/Skeletons';

const usd = (n: number) => `$${(n ?? 0).toFixed(n < 1 ? 4 : 2)}`;

export default function SellerSettings() {
  const [usage, setUsage] = useState<OpenaiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getOpenaiUsage();
      setUsage(res.data);
      setCreditInput(String(res.data.creditAdded || ''));
      setError(null);
    } catch (err) {
      setError('Failed to load OpenAI usage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsage(); }, []);

  const handleSaveCredit = async () => {
    const amount = parseFloat(creditInput);
    if (isNaN(amount) || amount < 0) return;
    try {
      setSaving(true);
      await sellerService.setOpenaiCredit(amount);
      await fetchUsage();
    } catch (err) {
      setError('Failed to save credit amount');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const pctUsed = usage && usage.creditAdded > 0
    ? Math.min(100, (usage.spent / usage.creditAdded) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings — OpenAI Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">Token spend &amp; remaining credit for document verification</p>
        </div>
        <button
          onClick={fetchUsage}
          className="h-10 px-4 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {usage && (
        <>
          {/* Credit-exhausted warning */}
          {usage.exhausted && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Token limit reached — remaining credit is $0. The bot has stopped making OpenAI requests and is
                telling buyers verification is temporarily unavailable. Add more credit below to resume.
              </AlertDescription>
            </Alert>
          )}

          {/* Remaining credit hero */}
          <div className="surface-card rounded-2xl p-5 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining credit</p>
                <p className="text-4xl font-bold tabular-nums mt-1">{usd(usage.remaining)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  of {usd(usage.creditAdded)} added · {usd(usage.spent)} spent
                </p>
              </div>
              <Coins className="h-10 w-10 text-primary/70" />
            </div>
            {/* Usage bar */}
            <div className="mt-4">
              <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pctUsed > 90 ? 'bg-destructive' : pctUsed > 70 ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${pctUsed}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pctUsed.toFixed(1)}% used</p>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatTile icon={<TrendingDown className="h-4 w-4" />} label="Total spent" value={usd(usage.spent)} />
            <StatTile icon={<Activity className="h-4 w-4" />} label="Requests" value={String(usage.totalRequests)} />
            <StatTile icon={<Hash className="h-4 w-4" />} label="Total tokens" value={usage.totalTokens.toLocaleString()} />
            <StatTile icon={<TrendingDown className="h-4 w-4" />} label="Today's spend" value={usd(usage.today.spent)} sub={`${usage.today.requests} requests`} />
          </div>

          {usage.tokenOverhead ? (
            <p className="text-[11px] text-muted-foreground -mt-2">
              Each request includes a fixed <span className="font-semibold text-foreground">+{usage.tokenOverhead.toLocaleString()} token</span> overhead
              (configurable via <code className="font-mono">OPENAI_TOKEN_OVERHEAD</code>), already counted in the totals above.
            </p>
          ) : null}

          {/* Set credit */}
          <div className="surface-card rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-1">Credit added on OpenAI</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Enter the total USD you've added to your OpenAI account. Remaining is calculated as this minus what the bot has spent. (OpenAI doesn't expose live balance to project API keys.)
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditInput}
                  onChange={(e) => setCreditInput(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-40 pl-7 pr-3 rounded-lg bg-background border border-input text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <button
                onClick={handleSaveCredit}
                disabled={saving}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Recent requests */}
          <div className="surface-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent requests</h3>
            </div>

            {usage.recent.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No OpenAI requests yet</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">When</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Order</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Model</th>
                        <th className="text-right py-2.5 px-4 text-muted-foreground font-medium">Tokens</th>
                        <th className="text-right py-2.5 px-4 text-muted-foreground font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.recent.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="py-2.5 px-4 text-muted-foreground">{new Date(r.at).toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-mono text-xs">{r.orderNumber || '—'}</td>
                          <td className="py-2.5 px-4">{r.model}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{r.totalTokens.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{usd(r.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {usage.recent.map((r, i) => (
                    <div key={i} className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground break-all">{r.orderNumber || '—'}</span>
                        <span className="font-semibold tabular-nums">{usd(r.cost)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{r.model} · {r.totalTokens.toLocaleString()} tokens</span>
                        <span>{new Date(r.at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="surface-card rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
