import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft, Plus, Trash2, RefreshCw, Loader2, AlertTriangle,
  CheckCircle2, Clock, MinusCircle, Search,
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

const PAGE_SIZE = 25;

export default function ConvertPage() {
  const {
    autoConvertEnabled,
    convertTargetAsset,
    toggleAutoConvert,
    setConvertTarget,
    loading: systemLoading,
  } = useSystem();

  const [assets, setAssets] = useState<ConvertAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
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
      setAssets(list);
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
  const targetExistsInList = useMemo(
    () => enabledAssets.some((a) => a.symbol === convertTargetAsset),
    [enabledAssets, convertTargetAsset]
  );

  const onTargetChange = async (sym: string) => {
    if (!sym || sym === convertTargetAsset) return;
    await setConvertTarget(sym);
  };

  const onAddAsset = async () => {
    const symbol = addSymbol.trim().toUpperCase();
    if (!symbol || !/^[A-Z0-9]{2,16}$/.test(symbol)) {
      toast.error("Symbol must be 2-16 alphanumeric characters");
      return;
    }
    setAdding(true);
    try {
      await convertService.addAsset(symbol, addName.trim() || undefined);
      toast.success(`Added ${symbol}`);
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
            When ON, every released crypto is automatically swapped to{" "}
            <span className="font-semibold text-foreground">{convertTargetAsset}</span> via the Binance Convert API.
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

      {/* Toggle + target selector */}
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Auto-Convert</p>
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

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mt-5 items-end">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Convert every released coin into
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <select
                value={convertTargetAsset}
                onChange={(e) => onTargetChange(e.target.value)}
                disabled={assetsLoading || enabledAssets.length === 0}
                className="h-10 flex-1 rounded-lg border border-border bg-background text-foreground px-3 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition disabled:opacity-50"
              >
                {!targetExistsInList && (
                  <option value={convertTargetAsset}>
                    {convertTargetAsset} (current — not in list)
                  </option>
                )}
                {enabledAssets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol}{a.name ? ` — ${a.name}` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAddOpen(true)}
                className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" /> Add coin
              </button>
            </div>
          </div>
        </div>

        {/* Asset chips with delete */}
        {assets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Configured coins ({assets.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {assets.map((a) => {
                const isActive = a.symbol === convertTargetAsset;
                return (
                  <span
                    key={a.symbol}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border",
                      isActive
                        ? "bg-primary/15 text-primary border-primary/30"
                        : a.enabled
                          ? "bg-surface-2 text-foreground border-border"
                          : "bg-muted text-muted-foreground border-border opacity-60"
                    )}
                    title={a.name || a.symbol}
                  >
                    {a.symbol}
                    {!isActive && (
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="hover:text-destructive transition"
                        aria-label={`Remove ${a.symbol}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
          When OFF, no conversion runs — the released crypto stays in your Binance spot wallet untouched.
          This is completely separate from chat messages; the seller never sees anything related to conversion.
        </p>
      </motion.div>

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
            placeholder="Search order no, asset…"
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
              Enable auto-convert and complete a P2P order to see entries here.
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

      {/* Toggle confirm */}
      <ConfirmModal
        open={confirmToggle}
        title={autoConvertEnabled ? "Disable auto-convert?" : "Enable auto-convert?"}
        description={autoConvertEnabled
          ? "New orders will no longer be converted automatically. Released crypto will stay in your spot wallet."
          : `Every completed order will be auto-swapped to ${convertTargetAsset} via Binance Convert API.`}
        confirmLabel={autoConvertEnabled ? "Disable" : "Enable"}
        destructive={autoConvertEnabled}
        onConfirm={async () => { setConfirmToggle(false); await toggleAutoConvert(); }}
        onCancel={() => setConfirmToggle(false)}
      />

      {/* Delete asset confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.symbol} from list?`}
        description={`This will hide ${deleteTarget?.symbol} from the dropdown. Historical conversions stay intact.`}
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
              <h3 className="font-bold text-lg">Add convert target coin</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add any Binance-supported asset to the dropdown.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Symbol</label>
                <input
                  value={addSymbol}
                  onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. BUSD"
                  maxLength={16}
                  className="w-full mt-1 h-10 rounded-lg bg-background text-foreground border border-border px-3 text-sm font-bold tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Name (optional)</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Binance USD"
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
