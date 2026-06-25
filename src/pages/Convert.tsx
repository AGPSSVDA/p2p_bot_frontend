import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft, Plus, Trash2, RefreshCw, Loader2, AlertTriangle,
  CheckCircle2, Clock, MinusCircle, Search, Coins,
} from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { Toggle } from "@/components/Toggle";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  convertService,
  ConvertAsset,
  ConversionRow,
  ConversionListData,
} from "@/services/convert.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FIXED_TARGET = "USDT";
const PAGE_SIZE = 25;

export default function ConvertPage() {
  const {
    autoConvertEnabled,
    toggleAutoConvert,
    loading: systemLoading,
  } = useSystem();

  const [assets, setAssets] = useState<ConvertAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<ConversionListData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "SUCCESS" | "PENDING" | "FAILED" | "SKIPPED">("");
  const [refreshing, setRefreshing] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConvertAsset | null>(null);

  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const list = await convertService.listAssets(false);
      // USDT is the fixed target — never show it in the source list
      setAssets(list.filter((a) => a.symbol.toUpperCase() !== FIXED_TARGET));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load assets");
    } finally {
      setAssetsLoading(false);
    }
  };

  const fetchHistory = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const d = await convertService.listHistory({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        q: search || undefined,
      });
      setData(d);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load conversions");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);
  useEffect(() => {
    fetchHistory();
    const t = setInterval(() => fetchHistory(false), 15_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const enabledAssets = useMemo(() => assets.filter((a) => a.enabled), [assets]);

  const toggleSourceCoin = async (asset: ConvertAsset) => {
    if (pendingToggles[asset.symbol]) return;
    const next = !asset.enabled;
    // Optimistic update
    setPendingToggles((p) => ({ ...p, [asset.symbol]: true }));
    setAssets((list) =>
      list.map((a) => (a.symbol === asset.symbol ? { ...a, enabled: next } : a))
    );
    try {
      await convertService.updateAsset(asset.symbol, { enabled: next });
      toast.success(
        next
          ? `${asset.symbol} → USDT auto-convert ON`
          : `${asset.symbol} auto-convert OFF`
      );
    } catch (err: any) {
      // Roll back
      setAssets((list) =>
        list.map((a) => (a.symbol === asset.symbol ? { ...a, enabled: !next } : a))
      );
      toast.error(err?.response?.data?.message || `Failed to update ${asset.symbol}`);
    } finally {
      setPendingToggles((p) => {
        const next2 = { ...p };
        delete next2[asset.symbol];
        return next2;
      });
    }
  };

  const onAddAsset = async () => {
    const symbol = addSymbol.trim().toUpperCase();
    if (!symbol || !/^[A-Z0-9]{2,16}$/.test(symbol)) {
      toast.error("Symbol must be 2-16 alphanumeric characters");
      return;
    }
    if (symbol === FIXED_TARGET) {
      toast.error(`${FIXED_TARGET} is the fixed target — it can't be a source coin`);
      return;
    }
    setAdding(true);
    try {
      await convertService.addAsset(symbol, addName.trim() || undefined);
      toast.success(`Added ${symbol}. Toggle it ON to start auto-convert.`);
      setAddOpen(false);
      setAddSymbol("");
      setAddName("");
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add asset");
    } finally {
      setAdding(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await convertService.deleteAsset(deleteTarget.symbol);
      toast.success(`Removed ${deleteTarget.symbol}`);
      setDeleteTarget(null);
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove asset");
    }
  };

  const conversions = data?.conversions || [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Auto-Convert</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick which source coins to auto-swap. Every selected coin gets converted to{" "}
            <span className="font-semibold text-foreground">{FIXED_TARGET}</span> on order completion.
          </p>
        </div>
        <button
          onClick={() => fetchHistory(true)}
          disabled={refreshing}
          className="h-10 px-4 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Master toggle */}
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          "surface-card rounded-2xl p-5 transition",
          autoConvertEnabled && "shadow-[0_0_28px_-10px_hsl(var(--primary)/0.55)] border-primary/30"
        )}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              autoConvertEnabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Auto-Convert Master Switch</p>
              <p className="text-lg font-bold mt-0.5 flex items-center gap-2">
                {autoConvertEnabled ? "Enabled" : "Disabled"}
                <span className={cn("h-2 w-2 rounded-full", autoConvertEnabled ? "bg-success animate-pulse-glow" : "bg-muted-foreground")} />
              </p>
            </div>
          </div>
          <Toggle
            disabled={systemLoading}
            checked={autoConvertEnabled}
            onChange={() => setConfirmToggle(true)}
          />
        </div>

        <div className="mt-4 rounded-lg bg-surface-2 border border-border px-4 py-3 flex items-center gap-3">
          <Coins className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Fixed Target</p>
            <p className="text-sm font-bold mt-0.5">
              Always convert to <span className="text-primary">{FIXED_TARGET}</span>
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {enabledAssets.length} of {assets.length} source coin{assets.length === 1 ? "" : "s"} active
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
          When the master switch is OFF, no conversion runs.
          When ON, only the source coins toggled below get auto-converted; everything else stays in your spot wallet untouched.
          The seller never sees anything about this — chat flow is unaffected.
        </p>
      </motion.div>

      {/* Source coin selector */}
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-sm">Source coins → {FIXED_TARGET}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Toggle each coin you want to auto-convert. Multiple selections allowed.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" /> Add coin
          </button>
        </div>

        {assetsLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading source coins...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center">
            <Coins className="h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 font-semibold">No source coins configured</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add coin" to add the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {assets.map((a) => {
              const isPending = !!pendingToggles[a.symbol];
              return (
                <div
                  key={a.symbol}
                  className={cn(
                    "rounded-xl border p-3 flex items-center justify-between gap-3 transition",
                    a.enabled
                      ? "bg-primary/10 border-primary/30"
                      : "bg-surface-2 border-border hover:border-border/80"
                  )}
                >
                  <button
                    onClick={() => toggleSourceCoin(a)}
                    disabled={isPending}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:opacity-60"
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 border",
                        a.enabled
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border"
                      )}
                    >
                      {a.symbol.slice(0, 3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{a.symbol}</p>
                      {a.name && (
                        <p className="text-[10px] text-muted-foreground truncate">{a.name}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Toggle
                      checked={a.enabled}
                      onChange={() => toggleSourceCoin(a)}
                      disabled={isPending}
                    />
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition flex items-center justify-center"
                      aria-label={`Remove ${a.symbol}`}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Success" value={summary?.success ?? 0} tone="success" icon={CheckCircle2} />
        <SummaryTile label="Pending" value={summary?.pending ?? 0} tone="warning" icon={Clock} />
        <SummaryTile label="Failed"  value={summary?.failed  ?? 0} tone="destructive" icon={AlertTriangle} />
        <SummaryTile label="Skipped" value={summary?.skipped ?? 0} tone="muted" icon={MinusCircle} />
      </div>

      {/* Filters */}
      <div className="surface-card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order no, asset..."
            className="w-full h-10 rounded-lg bg-background text-foreground border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 w-full sm:w-44 rounded-lg bg-background text-foreground border border-border px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
        >
          <option value="">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="SKIPPED">Skipped</option>
        </select>
      </div>

      {/* History table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr_1fr_0.9fr] gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-2/50">
          <span>ORDER</span>
          <span>FROM</span>
          <span>TO</span>
          <span>RATE</span>
          <span>RECEIVED</span>
          <span>WHEN</span>
          <span>STATUS</span>
        </div>

        {!data ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading conversions...</p>
          </div>
        ) : conversions.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 font-semibold">No conversions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable the master switch + at least one source coin, then complete a P2P order.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              {conversions.map((c, i) => <ConversionRowDesktop key={c.id} row={c} index={i} />)}
            </div>
            <div className="md:hidden divide-y divide-border">
              {conversions.map((c) => <ConversionRowMobile key={c.id} row={c} />)}
            </div>
            <Pagination page={page} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* Master-toggle confirm */}
      <ConfirmModal
        open={confirmToggle}
        title={autoConvertEnabled ? "Disable auto-convert?" : "Enable auto-convert?"}
        description={autoConvertEnabled
          ? "New orders will no longer be converted automatically. Released crypto will stay in your spot wallet."
          : `Selected source coins will be auto-swapped to ${FIXED_TARGET} via Binance Convert after every completed order.`}
        confirmLabel={autoConvertEnabled ? "Disable" : "Enable"}
        destructive={autoConvertEnabled}
        onConfirm={async () => { setConfirmToggle(false); await toggleAutoConvert(); }}
        onCancel={() => setConfirmToggle(false)}
      />

      {/* Delete asset confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.symbol}?`}
        description={`This removes ${deleteTarget?.symbol} from the source-coin list entirely. Historical conversions stay intact.`}
        confirmLabel="Remove"
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add asset modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !adding && setAddOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md surface-card rounded-2xl p-6 space-y-4"
          >
            <div>
              <h3 className="font-bold text-lg">Add source coin</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add any Binance-supported asset. Toggle it ON afterward to start auto-converting it to {FIXED_TARGET}.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Symbol</label>
                <input
                  value={addSymbol}
                  onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. SHIB"
                  maxLength={16}
                  className="w-full mt-1 h-10 rounded-lg bg-background text-foreground border border-border px-3 text-sm font-bold tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Name (optional)</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Shiba Inu"
                  className="w-full mt-1 h-10 rounded-lg bg-background text-foreground border border-border px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddOpen(false)}
                disabled={adding}
                className="h-9 px-4 rounded-lg bg-surface-2 border border-border text-sm font-medium hover:bg-surface-3 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onAddAsset}
                disabled={adding || !addSymbol.trim()}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add coin
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label, value, tone, icon: Icon,
}: {
  label: string; value: number;
  tone: "success" | "warning" | "destructive" | "muted";
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <Icon className={cn(
          "h-4 w-4",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )} />
      </div>
      <p className={cn(
        "text-2xl font-bold mt-1 tabular-nums",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "destructive" && "text-destructive",
        tone === "muted" && "text-foreground",
      )}>{value}</p>
    </div>
  );
}

function fmtAmount(v: number | null | undefined, decimals = 8) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function ConversionRowDesktop({ row, index }: { row: ConversionRow; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
      className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr_1fr_0.9fr] gap-3 px-5 py-3.5 border-b border-border hover:bg-surface-2/60 transition items-center"
    >
      <div className="min-w-0">
        <p className="text-xs font-mono truncate">{row.order_no}</p>
        {row.error_message && (
          <p className="text-[10px] text-destructive truncate mt-0.5" title={row.error_message}>
            ⚠ {row.error_message}
          </p>
        )}
      </div>
      <span className="text-xs font-semibold tabular-nums">
        {fmtAmount(row.from_amount)} <span className="text-muted-foreground">{row.from_asset}</span>
      </span>
      <span className="text-xs tabular-nums">
        <span className="text-muted-foreground">→</span> {row.to_asset}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground" title={row.rate ? String(row.rate) : ""}>
        {row.rate != null ? `1 ${row.from_asset} = ${fmtAmount(row.rate, 6)} ${row.to_asset}` : "—"}
      </span>
      <span className="text-xs font-semibold tabular-nums">
        {row.to_amount != null
          ? <>{fmtAmount(row.to_amount)} <span className="text-muted-foreground">{row.to_asset}</span></>
          : <span className="text-muted-foreground">—</span>}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {new Date(row.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
      </span>
      <StatusBadge status={row.status} />
    </motion.div>
  );
}

function ConversionRowMobile({ row }: { row: ConversionRow }) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-mono truncate">{row.order_no}</p>
        <StatusBadge status={row.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">From</p>
          <p className="font-semibold tabular-nums">{fmtAmount(row.from_amount)} {row.from_asset}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">To</p>
          <p className="font-semibold tabular-nums">
            {row.to_amount != null ? fmtAmount(row.to_amount) : "—"} {row.to_asset}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Rate</p>
          <p className="tabular-nums">{row.rate != null ? fmtAmount(row.rate, 6) : "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">When</p>
          <p>{new Date(row.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
        </div>
      </div>
      {row.error_message && (
        <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1.5 mt-2">
          ⚠ {row.error_message}
        </p>
      )}
    </div>
  );
}
