import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, Wallet, RefreshCw, Loader2 } from "lucide-react";
import { paymentsService, PaymentRow, PaymentsListData } from "@/services/payments.service";
import { useSystem } from "@/context/SystemContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { RowSkeleton } from "@/components/Skeletons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export default function Payments() {
  const { autoPayout } = useSystem();
  const [data, setData] = useState<PaymentsListData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "SUCCESS" | "PENDING" | "FAILED">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm] = useState<PaymentRow | null>(null);
  const [approveUtr, setApproveUtr] = useState("");
  const [approving, setApproving] = useState(false);

  const fetch = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const d = await paymentsService.list({
        page,
        limit: PAGE_SIZE,
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setData(d);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
    const t = setInterval(() => fetch(false), 20_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const onApprove = async () => {
    if (!confirm) return;
    if (!approveUtr.trim()) {
      toast.error("UTR is required");
      return;
    }
    setApproving(true);
    try {
      await paymentsService.approve(confirm.payout_id, approveUtr.trim());
      toast.success(`Payout approved for ${confirm.sellerName || confirm.orderId}`);
      setConfirm(null);
      setApproveUtr("");
      fetch(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  const payments = data?.payments || [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payments &amp; Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mode: {autoPayout
              ? <span className="text-success font-semibold">Auto Payout</span>
              : <span className="text-warning font-semibold">Manual Approval Required</span>}
          </p>
        </div>
        <button
          onClick={() => fetch(true)}
          disabled={refreshing}
          className="h-10 px-4 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="surface-card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order id, PAN name, UTR…"
            className="w-full h-10 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 w-full sm:w-44 rounded-lg bg-surface-2 border border-border px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
        >
          <option value="">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Success", count: summary?.success ?? 0, total: summary?.success_amount ?? 0, tone: "success" as const },
          { label: "Pending", count: summary?.pending ?? 0, total: summary?.pending_amount ?? 0, tone: "warning" as const },
          { label: "Failed",  count: summary?.failed  ?? 0, total: null, tone: "destructive" as const },
        ].map((s) => (
          <div key={s.label} className="surface-card rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-bold mt-1",
              s.tone === "success" && "text-success",
              s.tone === "warning" && "text-warning",
              s.tone === "destructive" && "text-destructive",
            )}>{s.count}</p>
            {s.total != null && (
              <p className="text-[10px] text-muted-foreground mt-1">₹{s.total.toLocaleString("en-IN")}</p>
            )}
          </div>
        ))}
      </div>

      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Payment Logs</h2>
          {!autoPayout && (summary?.pending ?? 0) > 0 && (
            <span className="text-[11px] font-semibold text-warning">{summary?.pending} awaiting approval</span>
          )}
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} cols={3} />)
          ) : payments.length === 0 ? (
            <div className="py-14 flex flex-col items-center text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 font-semibold">No payments found</p>
            </div>
          ) : payments.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="px-4 lg:px-5 py-4 hover:bg-surface-2/60 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{p.sellerName || "—"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {p.id} • Order {p.orderId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold tabular-nums">₹{p.amount.toLocaleString("en-IN")}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px]">
                <Info label="UPI" value={p.upi || "—"} />
                <Info label="UTR" value={p.utr || "—"} mono />
                <Info label="Method" value={p.method || "—"} />
                <Info label="PAN" value={p.sellerPan || "—"} mono />
                <Info label="Order Amount" value={`₹${p.total_order_amount.toLocaleString("en-IN")}`} />
                <Info label="TDS" value={`₹${p.tds_amount.toLocaleString("en-IN")}`} />
                <Info
                  label="Time"
                  value={new Date(p.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                />
              </div>
              {!autoPayout && p.status === "PENDING" && (
                <div className="flex gap-2 mt-4">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setConfirm(p); setApproveUtr(""); }}
                    className="h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.6)]"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve payout
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        {data && data.total > 0 && (
          <Pagination page={page} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {/* Approve modal — collects UTR */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !approving && setConfirm(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md surface-card rounded-2xl p-6 space-y-4"
          >
            <div>
              <h3 className="font-bold text-lg">Approve payout</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ₹{confirm.amount.toLocaleString("en-IN")} for {confirm.sellerName || confirm.orderId} ({confirm.upi || confirm.method || "—"})
              </p>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">UTR Number</label>
              <input
                value={approveUtr}
                onChange={(e) => setApproveUtr(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full mt-1 h-10 rounded-lg bg-surface-2 border border-border px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={approving}
                className="h-9 px-4 rounded-lg bg-surface-2 border border-border text-sm font-medium hover:bg-surface-3 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onApprove}
                disabled={approving || !approveUtr.trim()}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve &amp; release
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 truncate", mono && "font-mono")}>{value}</p>
    </div>
  );
}
