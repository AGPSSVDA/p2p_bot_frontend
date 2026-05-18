import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownUp, CalendarClock, CheckCircle2, Circle, Megaphone, ShieldCheck,
  TimerReset, TrendingUp, Wallet, IndianRupee, Tag, RefreshCw, Loader2,
  type LucideIcon,
} from "lucide-react";
import { adsService, AdRow, AdsListData } from "@/services/ads.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdsPage() {
  const [data, setData] = useState<AdsListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const d = await adsService.list();
      setData(d);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load ads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
    const t = setInterval(() => fetch(false), 30_000);
    return () => clearInterval(t);
  }, []);

  const ads: AdRow[] = data?.ads || [];
  const s = data?.summary;

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading ads…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-ad analytics grouped by adv_no — {data?.liveAdsFetched ?? 0} pulled live from Binance.
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

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Ads" value={s?.totalAds ?? 0} />
        <SummaryTile label="Orders" value={s?.totalOrders ?? 0} />
        <SummaryTile label="Active now" value={s?.activeNow ?? 0} accent="success" />
        <SummaryTile label="Avg completion" value={`${(s?.avgCompletionRate ?? 0).toFixed(1)}%`} />
      </div>

      {ads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {ads.map((ad, i) => (
            <motion.div
              key={ad.advNo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="surface-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate font-mono text-sm">{ad.advNo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ad.tradeType} • {ad.asset}/{ad.fiat}
                      {ad.status ? ` • ${ad.status}` : ""}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  ad.activeNow > 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                )}>
                  <Circle className="h-2 w-2 fill-current" />
                  {ad.activeNow} active now
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <Metric label="Total orders" value={String(ad.totalOrders)} icon={ArrowDownUp} />
                <Metric label="Completed" value={String(ad.completed)} icon={CheckCircle2} />
                <Metric label="Cancelled" value={String(ad.cancelled)} icon={TimerReset} />
                <Metric label="Completion %" value={`${ad.completionRate.toFixed(2)}%`} icon={ShieldCheck} />
                <Metric label="Total volume" value={`₹${ad.totalVolume.toLocaleString("en-IN")}`} icon={Wallet} />
                <Metric label="Total crypto" value={ad.totalCrypto.toLocaleString("en-IN")} icon={TrendingUp} />
                <Metric label="Avg order size" value={`₹${ad.avgOrderSize.toLocaleString("en-IN")}`} icon={Megaphone} />
                <Metric
                  label="Last order"
                  value={ad.lastOrder
                    ? new Date(ad.lastOrder).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                  icon={CalendarClock}
                />
                {ad.price != null && (
                  <Metric label="Price" value={`₹${Number(ad.price).toLocaleString("en-IN")}`} icon={IndianRupee} />
                )}
                {(ad.minAmount != null || ad.maxAmount != null) && (
                  <Metric
                    label="Min / Max"
                    value={`₹${(ad.minAmount ?? 0).toLocaleString("en-IN")} – ₹${(ad.maxAmount ?? 0).toLocaleString("en-IN")}`}
                    icon={Tag}
                  />
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-3 gap-3 text-[10px] text-muted-foreground">
                {ad.firstSeenAt && (
                  <div><p className="uppercase tracking-wider">First seen</p><p className="mt-0.5">{new Date(ad.firstSeenAt).toLocaleDateString("en-IN")}</p></div>
                )}
                {ad.lastSeenAt && (
                  <div><p className="uppercase tracking-wider">Last seen</p><p className="mt-0.5">{new Date(ad.lastSeenAt).toLocaleDateString("en-IN")}</p></div>
                )}
                {ad.lastSyncedAt && (
                  <div><p className="uppercase tracking-wider">Synced</p><p className="mt-0.5">{new Date(ad.lastSyncedAt).toLocaleDateString("en-IN")}</p></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: string | number; accent?: "success" | "warning" }) {
  return (
    <div className="surface-card rounded-xl px-4 py-3 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn(
        "text-xl font-bold mt-0.5",
        accent === "success" && "text-success",
        accent === "warning" && "text-warning",
      )}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-wider truncate">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </div>
      <p className="text-sm font-bold tabular-nums mt-0.5 truncate">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface-card rounded-2xl py-16 flex flex-col items-center text-center">
      <Megaphone className="h-10 w-10 text-muted-foreground/60" />
      <p className="mt-4 font-semibold">No ads yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Ads populate from incoming orders. Once Binance returns a new order, its adv_no will appear here.
      </p>
    </div>
  );
}
