import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ListOrdered, RefreshCw, X, Eye, XOctagon, Loader2, Bot, UserCog } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { RowSkeleton } from "@/components/Skeletons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ordersService, OrderRow, OrderDetailData, OrderState } from "@/services/orders.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: ("ALL" | OrderState)[] = [
  "ALL",
  "NEW_ORDER",
  "WAITING_FOR_PAN",
  "VALIDATING_PAN",
  "PAN_VERIFIED",
  "WAITING_TDS_CONSENT",
  "TDS_ACCEPTED",
  "PROCESSING_PAYMENT",
  "AWAITING_MANUAL_PAYMENT",
  "PAYMENT_SENT",
  "WAITING_FOR_RELEASE",
  "COMPLETED",
  "ESCALATED",
  "FAILED",
  "CANCELLED",
];

const PAGE_SIZE = 25;

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderState>("ALL");
  const [processedBy, setProcessedBy] = useState<"ALL" | "BOT" | "MANUAL">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await ordersService.list({
        page,
        limit: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
        q: search || undefined,
        processed_by: processedBy === "ALL" ? undefined : processedBy,
      });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // poll every 15s
    const t = setInterval(() => fetchOrders(false), 15_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search, processedBy]);

  useEffect(() => { setPage(1); }, [search, status, processedBy]);

  const fetchDetail = async (orderNo: string) => {
    setSelected(orderNo);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await ordersService.get(orderNo);
      setDetail(d);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load order detail");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await ordersService.cancel(cancelTarget.order_no);
      toast.success(`Cancel request sent for ${cancelTarget.order_no}`);
      setCancelTarget(null);
      fetchOrders(true);
      if (selected === cancelTarget.order_no) fetchDetail(cancelTarget.order_no);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} {total === 1 ? "order" : "orders"} match your filters.
          </p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          className="h-10 px-4 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition disabled:opacity-50"
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="surface-card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order no, seller, PAN, name…"
            className="w-full h-10 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-10 w-full sm:w-56 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition appearance-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border h-10">
          {(["ALL", "BOT", "MANUAL"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProcessedBy(p)}
              className={cn(
                "px-3 h-full rounded-md text-[11px] font-semibold transition flex items-center gap-1.5",
                processedBy === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={p === "BOT" ? "Bot-handled orders only"
                  : p === "MANUAL" ? "Manually completed (synced) orders only"
                  : "All orders"}
            >
              {p === "BOT" && <Bot className="h-3 w-3" />}
              {p === "MANUAL" && <UserCog className="h-3 w-3" />}
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1fr_1fr_1fr_0.9fr_0.9fr_0.9fr_1fr_0.8fr_auto] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-2/50">
            <span>Order</span>
            <span>Seller</span>
            <span>PAN</span>
            <span>Amount</span>
            <span>Crypto</span>
            <span>Method</span>
            <span>Created</span>
            <span>Status</span>
            <span />
          </div>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} cols={9} />)
          ) : orders.length === 0 ? (
            <Empty />
          ) : orders.map((o, i) => (
            <motion.div
              key={o.order_no}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="grid grid-cols-[1fr_1fr_1fr_0.9fr_0.9fr_0.9fr_1fr_0.8fr_auto] gap-3 px-5 py-3.5 items-center border-b border-border hover:bg-surface-2/60 transition"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{o.id}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">{o.order_no}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm truncate">{o.seller_name || o.seller_nickname || "—"}</p>
                {o.seller_user_id && <p className="text-[10px] text-muted-foreground truncate">{o.seller_user_id}</p>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-mono truncate">{o.pan || "—"}</p>
                {o.pan_name && <p className="text-[10px] text-muted-foreground truncate">{o.pan_name}</p>}
              </div>
              <span className="text-sm font-semibold tabular-nums">₹{o.amount.toLocaleString("en-IN")}</span>
              <span className="text-sm tabular-nums">{o.crypto_amount} {o.asset || ""}</span>
              <span className="text-sm">{o.payment_method || "—"}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusBadge status={o.state} />
                <ProcessedByBadge value={o.processed_by} />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchDetail(o.order_no)}
                  className="p-1.5 rounded-md hover:bg-surface-3 text-muted-foreground hover:text-primary transition"
                  title="View detail"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {o.is_live && o.state !== "COMPLETED" && o.state !== "CANCELLED" && (
                  <button
                    onClick={() => setCancelTarget(o)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                    title="Cancel"
                  >
                    <XOctagon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-4"><RowSkeleton cols={2} /></div>)
          ) : orders.length === 0 ? <Empty /> : orders.map((o, i) => (
            <motion.div
              key={o.order_no}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="p-4 space-y-2"
              onClick={() => fetchDetail(o.order_no)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{o.id}</p>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <StatusBadge status={o.state} />
                  <ProcessedByBadge value={o.processed_by} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">Seller</p><p className="font-medium">{o.seller_name || o.seller_nickname || "—"}</p></div>
                <div><p className="text-muted-foreground">PAN</p><p className="font-mono">{o.pan || "—"}</p></div>
                <div><p className="text-muted-foreground">INR</p><p className="font-semibold tabular-nums">₹{o.amount.toLocaleString("en-IN")}</p></div>
                <div><p className="text-muted-foreground">{o.asset || "—"}</p><p className="tabular-nums">{o.crypto_amount}</p></div>
              </div>
              <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
            </motion.div>
          ))}
        </div>

        {total > 0 && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <OrderDetailDrawer
          orderNo={selected}
          detail={detail}
          loading={detailLoading}
          onClose={() => { setSelected(null); setDetail(null); }}
        />
      )}

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel this order?"
        description={`Cancel ${cancelTarget?.order_no} on Binance? This sends reasonCode=6 (seller cannot release).`}
        confirmLabel={cancelling ? "Cancelling…" : "Cancel order"}
        destructive
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

function ProcessedByBadge({ value }: { value: string | null | undefined }) {
  const v = (value || "BOT").toUpperCase();
  const isBot = v === "BOT";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border whitespace-nowrap",
        isBot
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-warning/10 text-warning border-warning/30"
      )}
      title={isBot ? "Handled end-to-end by the bot" : "Order completed manually / synced from Binance"}
    >
      {isBot ? <Bot className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
      {v}
    </span>
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

function OrderDetailDrawer({ orderNo, detail, loading, onClose }: {
  orderNo: string;
  detail: OrderDetailData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const o = detail?.order;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ x: 600 }} animate={{ x: 0 }} exit={{ x: 600 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-full bg-surface-1 border-l border-border overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface-1 z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Order</p>
            <p className="font-bold text-sm font-mono">{orderNo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading || !o ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading order…</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusBadge status={o.state} />
                <ProcessedByBadge value={o.processed_by} />
              </div>
              {detail?.live && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/30">
                  Live in bot
                </span>
              )}
            </div>

            <Section title="Order">
              <Row label="Order No" value={<span className="font-mono">{o.order_no}</span>} />
              <Row label="Adv No" value={<span className="font-mono">{o.adv_no || "—"}</span>} />
              <Row label="Asset / Fiat" value={`${o.asset || "—"} / ${o.fiat || "—"}`} />
              <Row label="Amount" value={`₹${o.amount.toLocaleString("en-IN")}`} />
              <Row label="Crypto" value={`${o.crypto_amount} ${o.asset || ""}`} />
              <Row label="Created" value={new Date(o.created_at).toLocaleString("en-IN")} />
              <Row label="Updated" value={new Date(o.updated_at).toLocaleString("en-IN")} />
              <Row label="Confirm Pay End" value={o.confirm_pay_end_time ? new Date(o.confirm_pay_end_time).toLocaleString("en-IN") : "—"} />
              <Row label="Notify Pay End" value={o.notify_pay_end_time ? new Date(o.notify_pay_end_time).toLocaleString("en-IN") : "—"} />
            </Section>

            <Section title="Seller">
              <Row label="Nickname" value={o.seller_nickname} />
              <Row label="KYC Name" value={o.seller_name} />
              <Row label="User ID" value={<span className="font-mono">{o.seller_user_id}</span>} />
            </Section>

            <Section title="PAN / KYC">
              <Row label="PAN" value={<span className="font-mono">{o.pan_full || o.pan || "—"}</span>} />
              <Row label="PAN Name" value={o.pan_name} />
              <Row label="Retries" value={o.pan_retries} />
              <Row label="Name Match" value={o.name_match_status} />
            </Section>

            <Section title="TDS">
              <Row label="Pre-TDS" value={`₹${o.pre_tds_amount.toLocaleString("en-IN")}`} />
              <Row label="TDS (1%)" value={`₹${o.tds_amount.toLocaleString("en-IN")}`} />
              <Row label="Post-TDS" value={`₹${o.post_tds_amount.toLocaleString("en-IN")}`} />
            </Section>

            <Section title="Payment">
              <Row label="Method" value={o.payment_method} />
              <Row label="UPI" value={o.upi_id} />
              <Row label="Account" value={o.account_no} />
              <Row label="IFSC" value={o.ifsc_code} />
              <Row label="Bank" value={o.bank_name} />
              <Row label="Holder Name" value={o.account_name} />
              <Row label="Payout ID" value={o.payout_id} />
              <Row label="UTR" value={<span className="font-mono">{o.utr_number}</span>} />
            </Section>

            {(o.completed_at || o.cancelled_at || o.escalated_at) && (
              <Section title="Terminal timestamps">
                {o.completed_at && <Row label="Completed" value={new Date(o.completed_at).toLocaleString("en-IN")} />}
                {o.cancelled_at && <Row label="Cancelled" value={new Date(o.cancelled_at).toLocaleString("en-IN")} />}
                {o.escalated_at && <Row label="Escalated" value={new Date(o.escalated_at).toLocaleString("en-IN")} />}
                {o.cancel_reason && <Row label="Cancel Reason" value={o.cancel_reason} />}
              </Section>
            )}

            {detail?.state_log && detail.state_log.length > 0 && (
              <Section title={`State log (${detail.state_log.length})`}>
                <div className="space-y-1.5">
                  {detail.state_log.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-muted-foreground">
                        {s.from_state ? `${s.from_state} → ` : ""}{s.to_state}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(s.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {detail?.messages && detail.messages.length > 0 && (
              <Section title={`Chat (${detail.messages.length})`}>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detail.messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg p-2.5 text-xs",
                        m.direction === "OUT" ? "bg-primary/10 ml-8" : "bg-surface-2 mr-8"
                      )}
                    >
                      <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {m.direction === "OUT" ? "Bot" : "Seller"} · {new Date(m.created_at).toLocaleTimeString("en-IN")}
                      </p>
                      <p className="whitespace-pre-wrap">{m.message_text}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card rounded-xl p-4">
      <h4 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2.5">{title}</h4>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}
