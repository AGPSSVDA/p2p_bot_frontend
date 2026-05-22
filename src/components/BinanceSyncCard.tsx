import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { adminService, BINANCE_STATUS, SyncResult } from "@/services/admin.service";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<number, string> = {
  [BINANCE_STATUS.WAIT_PAYMENT]:  "Wait Payment",
  [BINANCE_STATUS.WAIT_RELEASE]:  "Wait Release",
  [BINANCE_STATUS.APPEALING]:     "Appealing",
  [BINANCE_STATUS.COMPLETED]:     "Completed",
  [BINANCE_STATUS.CANCELLED]:     "Cancelled",
  [BINANCE_STATUS.SYS_CANCELLED]: "Sys-Cancelled",
};

// Default statuses to pull on the deep-sync — terminal orders, since the
// live poller already handles status 1/2 in real time.
const DEFAULT_STATUSES = [
  BINANCE_STATUS.APPEALING,
  BINANCE_STATUS.COMPLETED,
  BINANCE_STATUS.CANCELLED,
  BINANCE_STATUS.SYS_CANCELLED,
];

export function BinanceSyncCard() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [maxPages, setMaxPages] = useState(20);
  const [lastResult, setLastResult] = useState<{
    total: number;
    perStatus: SyncResult[];
    at: string;
  } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const runSync = async () => {
    setRunning(true);
    setLastError(null);
    try {
      const res = await adminService.syncBinanceOrders({
        statuses: DEFAULT_STATUSES,
        maxPages,
        rowsPerPage: 50,
      });
      const data = res.data;
      setLastResult({
        total: data.total,
        perStatus: data.perStatus,
        at: new Date().toLocaleString("en-IN"),
      });
      toast.success(`Synced ${data.total} order(s) from Binance`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Sync failed";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setRunning(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <motion.div whileHover={{ y: -2 }} className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-info/15 text-info flex items-center justify-center">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Binance Sync</p>
              <p className="text-lg font-bold mt-0.5">Backfill historical orders</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setConfirmOpen(true)}
            disabled={running}
            className={cn(
              "h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-[0_4px_18px_-6px_hsl(var(--info)/0.5)]",
              "bg-info text-info-foreground hover:bg-info/90 disabled:opacity-50"
            )}
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {running ? "Syncing…" : "Sync now"}
          </motion.button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Pulls recent terminal orders (Completed, Cancelled, Appealing) from your Binance C2C account and
          upserts them into the local DB. Already-seen rows are not duplicated. The bot also runs a light
          sync every 5 minutes automatically — this is for a deeper one-shot backfill.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-2 border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Max pages per status</p>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <input
                type="number"
                min={1}
                max={100}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="w-20 h-9 rounded-md border border-border bg-background text-foreground px-2 text-base font-bold tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
              />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">pages × 50</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              Up to {maxPages * 50 * DEFAULT_STATUSES.length} orders per sync run.
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 border border-border p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Statuses</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DEFAULT_STATUSES.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-md bg-surface-1 border border-border px-2 py-1 text-[11px] font-semibold"
                >
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Live polling handles Wait-Payment / Wait-Release in real time, so we only deep-sync terminal states here.
            </p>
          </div>
        </div>

        {lastResult && (
          <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-success">
                  Last sync: {lastResult.total} order(s) upserted · {lastResult.at}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {lastResult.perStatus.map((r) => (
                    <span
                      key={r.status}
                      className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-foreground border border-border"
                    >
                      <span className="uppercase text-muted-foreground">{STATUS_LABEL[r.status] || `Status ${r.status}`}</span>
                      <span className="font-bold">{r.synced}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {lastError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] text-destructive">{lastError}</p>
          </div>
        )}
      </motion.div>

      <ConfirmModal
        open={confirmOpen}
        title="Sync from Binance?"
        description={`Pulls up to ${maxPages * 50 * DEFAULT_STATUSES.length} terminal orders into the DB. Safe to run — duplicates are ignored. May take 30–90 seconds.`}
        confirmLabel="Start sync"
        onConfirm={runSync}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
