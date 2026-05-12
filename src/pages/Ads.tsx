import { motion } from "framer-motion";
import { ArrowDownUp, CalendarClock, CheckCircle2, Circle, Megaphone, ShieldCheck, TimerReset, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { ADS_ANALYTICS } from "@/data/mock";
import { cn } from "@/lib/utils";

export default function AdsPage() {
  const ads = ADS_ANALYTICS;
  const totalAds = ads.length;
  const totalOrders = ads.reduce((sum, ad) => sum + ad.totalOrders, 0);
  const activeNow = ads.reduce((sum, ad) => sum + ad.activeNow, 0);
  const avgCompletion = ads.length ? ads.reduce((sum, ad) => sum + ad.completionRate, 0) / ads.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">Per-ad analytics grouped by advNo from the API.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="surface-card rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ads</p>
          <p className="text-xl font-bold mt-0.5">{totalAds}</p>
        </div>
        <div className="surface-card rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</p>
          <p className="text-xl font-bold mt-0.5">{totalOrders}</p>
        </div>
        <div className="surface-card rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active now</p>
          <p className="text-xl font-bold mt-0.5 text-success">{activeNow}</p>
        </div>
        <div className="surface-card rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion</p>
          <p className="text-xl font-bold mt-0.5">{avgCompletion.toFixed(1)}%</p>
        </div>
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
                    <p className="font-semibold truncate">{ad.advNo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ad.tradeType} • {ad.asset}/{ad.fiat}
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
                <Metric label="Total orders" value={ad.totalOrders.toString()} icon={ArrowDownUp} />
                <Metric label="Completed" value={ad.completed.toString()} icon={CheckCircle2} />
                <Metric label="Cancelled" value={ad.cancelled.toString()} icon={TimerReset} />
                <Metric label="Completion %" value={`${ad.completionRate.toFixed(2)}%`} icon={ShieldCheck} />
                <Metric label="Total volume" value={`₹${ad.totalVolume.toLocaleString("en-IN")}`} icon={Wallet} />
                <Metric label="Total crypto" value={ad.totalCrypto.toLocaleString("en-IN")} icon={TrendingUp} />
                <Metric label="Avg order size" value={`₹${ad.avgOrderSize.toLocaleString("en-IN")}`} icon={Megaphone} />
                <Metric
                  label="Last order"
                  value={new Date(ad.lastOrder).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  icon={CalendarClock}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
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
      <p className="text-sm text-muted-foreground mt-1">API ad analytics will show up here.</p>
    </div>
  );
}
