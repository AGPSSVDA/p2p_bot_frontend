import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ListOrdered } from "lucide-react";
import { ORDERS, type OrderStatus } from "@/data/mock";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { RowSkeleton } from "@/components/Skeletons";

const STATUSES: ("ALL" | OrderStatus)[] = [
  "ALL", "NEW_ORDER", "WAITING_FOR_PAN", "PAN_VERIFIED", "PAYMENT_SENT", "COMPLETED", "FAILED",
];

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    return ORDERS.filter((o) => {
      if (status !== "ALL" && o.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.id.toLowerCase().includes(q) && !o.sellerId.toLowerCase().includes(q) && !o.pan.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [search, status]);

  useEffect(() => { setPage(1); }, [search, status]);

  const pageSize = 10;
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} orders match your filters.</p>
      </div>

      {/* Filters */}
      <div className="surface-card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order id, seller or PAN…"
            className="w-full h-10 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={status} onChange={(e) => setStatus(e.target.value as any)}
            className="h-10 w-full sm:w-44 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition appearance-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1.1fr_0.9fr_1.1fr_0.9fr_0.9fr_1fr_auto] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-2/50">
            <span>Order ID</span><span>Seller</span><span>PAN</span><span>INR</span><span>Crypto</span><span>Time</span><span>Status</span>
          </div>
          {loading ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} cols={7} />) : slice.length === 0 ? (
            <Empty />
          ) : slice.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="grid grid-cols-[1.1fr_0.9fr_1.1fr_0.9fr_0.9fr_1fr_auto] gap-3 px-5 py-3.5 items-center border-b border-border hover:bg-surface-2/60 transition"
            >
              <span className="text-sm font-semibold">{o.id}</span>
              <span className="text-sm text-muted-foreground">{o.sellerId}</span>
              <span className="text-sm font-mono text-muted-foreground">{o.pan}</span>
              <span className="text-sm font-semibold tabular-nums">₹{o.inrAmount.toLocaleString("en-IN")}</span>
              <span className="text-sm tabular-nums">{o.cryptoAmount} {o.asset}</span>
              <span className="text-xs text-muted-foreground">{new Date(o.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
              <StatusBadge status={o.status} />
            </motion.div>
          ))}
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-4"><RowSkeleton cols={2} /></div>) : slice.length === 0 ? <Empty /> : slice.map((o, i) => (
            <motion.div key={o.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{o.id}</p>
                <StatusBadge status={o.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">Seller</p><p className="font-medium">{o.sellerId}</p></div>
                <div><p className="text-muted-foreground">PAN</p><p className="font-mono">{o.pan}</p></div>
                <div><p className="text-muted-foreground">INR</p><p className="font-semibold tabular-nums">₹{o.inrAmount.toLocaleString("en-IN")}</p></div>
                <div><p className="text-muted-foreground">{o.asset}</p><p className="tabular-nums">{o.cryptoAmount}</p></div>
              </div>
              <p className="text-[11px] text-muted-foreground">{new Date(o.time).toLocaleString("en-IN")}</p>
            </motion.div>
          ))}
        </div>

        {filtered.length > 0 && (
          <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="py-14 flex flex-col items-center text-center">
      <ListOrdered className="h-10 w-10 text-muted-foreground/60" />
      <p className="mt-3 font-semibold">No orders found</p>
      <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
    </div>
  );
}
