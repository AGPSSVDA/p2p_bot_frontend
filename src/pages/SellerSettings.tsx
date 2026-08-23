import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Coins, TrendingDown, Activity, Hash, MessageSquareText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { sellerService, OpenaiUsage } from '@/services/seller.service';
import { Skeleton } from '@/components/Skeletons';

const usd = (n: number) => `$${(n ?? 0).toFixed(n < 1 ? 4 : 2)}`;

export default function SellerSettings() {
  const [usage, setUsage] = useState<OpenaiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SMS OTP config (text + matching DLT template id)
  const [smsTemplate, setSmsTemplate] = useState('');
  const [smsDltId, setSmsDltId] = useState('');
  const [smsSaving, setSmsSaving] = useState(false);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getOpenaiUsage();
      setUsage(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load OpenAI usage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsConfig = async () => {
    try {
      const res = await sellerService.getSmsConfig();
      setSmsTemplate(res.data.otpTemplate || '');
      setSmsDltId(res.data.dltTemplateId || '');
    } catch (err) {
      console.error('Failed to load SMS config', err);
    }
  };

  const handleSaveSms = async () => {
    // Accept {otp} or the DLT variable {#var#} as the code slot (the backend
    // normalises {#var#} → {otp}).
    if (smsTemplate && !smsTemplate.includes('{otp}') && !smsTemplate.includes('{#var#}')) {
      toast.error('OTP template must contain {otp} (or the DLT {#var#}) where the code goes.');
      return;
    }
    try {
      setSmsSaving(true);
      await sellerService.updateSmsConfig(smsTemplate, smsDltId);
      toast.success('SMS OTP config saved');
      await fetchSmsConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save SMS config');
    } finally {
      setSmsSaving(false);
    }
  };

  useEffect(() => { fetchUsage(); fetchSmsConfig(); }, []);

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

          {/* Credit is configured on the server via env OPENAI_CREDIT_USD — no UI card.
              Remaining / added / spent already show in the hero + usage bar above. */}

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

      {/* ===== SMS OTP Settings ===== */}
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">SMS OTP template</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          The OTP SMS text and its matching <span className="font-semibold text-foreground">DLT Template Id</span>.
          They must be changed <span className="font-semibold text-foreground">together</span> — the DLT id is tied to
          the approved text, and the SMS gateway rejects any text/id that doesn't match its DLT registration.
          Mark the code slot with <code className="font-mono">{'{otp}'}</code> — you can also paste the DLT text
          as-is with its <code className="font-mono">{'{#var#}'}</code> variable and it will be converted.
        </p>

        <label className="text-xs font-medium text-muted-foreground">OTP message text</label>
        <textarea
          value={smsTemplate}
          onChange={(e) => setSmsTemplate(e.target.value)}
          rows={3}
          placeholder="AGPSS_GLOBAL_PVT: Your OTP for mobile number verification is {otp}. ..."
          className="mt-1 mb-3 w-full rounded-lg bg-background border border-input text-foreground text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary/40 resize-none"
        />

        <label className="text-xs font-medium text-muted-foreground">DLT Template Id</label>
        <input
          type="text"
          value={smsDltId}
          onChange={(e) => setSmsDltId(e.target.value)}
          placeholder="e.g. 1777178592039440191"
          className="mt-1 mb-3 h-10 w-full sm:w-72 px-3 rounded-lg bg-background border border-input text-foreground text-sm font-mono focus-visible:ring-2 focus-visible:ring-primary/40"
        />

        <div>
          <button
            onClick={handleSaveSms}
            disabled={smsSaving}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {smsSaving ? 'Saving…' : 'Save SMS config'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Leave blank to fall back to the values in the server <code className="font-mono">.env</code>. Other SMS
          settings (sender id, API key, route, PEID) stay in <code className="font-mono">.env</code>.
        </p>
      </div>
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
