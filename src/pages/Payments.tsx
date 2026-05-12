import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, Wallet } from "lucide-react";
import { PAYMENTS, type PaymentLog } from "@/data/mock";
import { useSystem } from "@/context/SystemContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RowSkeleton } from "@/components/Skeletons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Payments() {
  const { autoPayout } = useSystem();
  const [items, setItems] = useState<PaymentLog[]>(PAYMENTS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<PaymentLog | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const amount = p.amount.toString();
      return (
        p.sellerName.toLowerCase().includes(q) ||
        p.upi.toLowerCase().includes(q) ||
        p.utr.toLowerCase().includes(q) ||
        amount.includes(q)
      );
    });
  }, [items, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const failed = filtered.filter((p) => p.status === "FAILED");
  const pending = filtered.filter((p) => p.status === "PENDING");
  const success = filtered.filter((p) => p.status === "SUCCESS");

  const pageSize = 10;
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  const approve = (p: PaymentLog) => {
    setItems((prev) => prev.map((x) => x.id === p.id ? { ...x, status: "SUCCESS" } : x));
    toast.success(`Payout approved for ${p.sellerName}`);
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payments & Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mode: {autoPayout
              ? <span className="text-success font-semibold">Auto Payout</span>
              : <span className="text-warning font-semibold">Manual Approval Required</span>}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="surface-card rounded-2xl p-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, UTR, or amount…"
            className="w-full h-10 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Success", count: success.length, tone: "success" as const },
          { label: "Pending", count: pending.length, tone: "warning" as const },
          { label: "Failed",  count: failed.length,  tone: "destructive" as const },
        ].map((s) => (
          <div key={s.label} className="surface-card rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-bold mt-1",
              s.tone === "success" && "text-success",
              s.tone === "warning" && "text-warning",
              s.tone === "destructive" && "text-destructive",
            )}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Payment Logs</h2>
          {!autoPayout && pending.length > 0 && (
            <span className="text-[11px] font-semibold text-warning">{pending.length} awaiting approval</span>
          )}
        </div>

        <div className="divide-y divide-border">
          {loading ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} cols={3} />) : slice.map((p, i) => (
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
                    <p className="font-semibold text-sm">{p.sellerName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold tabular-nums">₹{p.amount.toLocaleString("en-IN")}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px]">
                <Info label="UPI" value={p.upi} />
                <Info label="UTR" value={p.utr} mono />
                <Info label="Time" value={new Date(p.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} />
              </div>
              {(p.status === "FAILED" || (!autoPayout && p.status === "PENDING")) && (
                <div className="flex gap-2 mt-4">
                  {!autoPayout && p.status === "PENDING" && (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setConfirm(p)}
                      className="h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.6)]">
                      <Check className="h-3.5 w-3.5" /> Approve payout
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Approve manual payout?"
        description={`₹${confirm?.amount.toLocaleString("en-IN")} will be released to ${confirm?.sellerName} (${confirm?.upi}).`}
        confirmLabel="Approve & release"
        onConfirm={() => confirm && approve(confirm)}
        onCancel={() => setConfirm(null)}
      />
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
