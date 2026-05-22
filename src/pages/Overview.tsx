import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Bot, Coins, IndianRupee, ShieldCheck,
  TrendingUp, XCircle, Zap, Megaphone, Wallet, ArrowUpRight,
  CalendarDays, Receipt, ListTree, UserCog,
} from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { Toggle } from "@/components/Toggle";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CardSkeleton } from "@/components/Skeletons";
import { BotTimersCard } from "@/components/BotTimersCard";
import { BinanceSyncCard } from "@/components/BinanceSyncCard";
import { overviewService, OverviewKpis } from "@/services/overview.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StatCard {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  icon: typeof Bot; trend?: string; tone?: "primary" | "success" | "warning" | "destructive" | "info";
}

function ProvenanceCard({
  tone, icon: Icon, label, total, completed, failed, description,
}: {
  tone: "primary" | "warning";
  icon: typeof Bot;
  label: string;
  total: number;
  completed: number;
  failed: number;
  description: string;
}) {
  const completionRate = total > 0 ? +((completed / total) * 100).toFixed(1) : 0;
  return (
    <motion.div whileHover={{ y: -2 }} className="surface-card rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
          tone === "primary" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-0.5 tabular-nums">{total}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</p>
          <p className="text-sm font-bold tabular-nums text-success mt-0.5">{completed}</p>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed/Cancel</p>
          <p className="text-sm font-bold tabular-nums text-destructive mt-0.5">{failed}</p>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Success %</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{completionRate}%</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const { botRunning, autoPayout, toggleBot, toggleAutoPayout, loading: systemLoading } = useSystem();
  const [kpis, setKpis] = useState<OverviewKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<null | "bot" | "payout">(null);

  const fetchKpis = async () => {
    try {
      const data = await overviewService.getOverview();
      setKpis(data);
    } catch (err: any) {
      console.error("Failed to load overview", err);
      toast.error(err?.response?.data?.message || "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    const t = setInterval(fetchKpis, 30_000);
    return () => clearInterval(t);
  }, []);

  const stats: StatCard[] = kpis ? [
    { label: "Orders Today",   value: kpis.orders_today,     icon: Activity,    tone: "primary",     trend: `${kpis.volume_today.toLocaleString("en-IN")} INR today` },
    { label: "Orders (Month)", value: kpis.orders_month,     icon: TrendingUp,  tone: "success",     trend: `₹${kpis.volume_month.toLocaleString("en-IN")} this month` },
    { label: "Total Orders",   value: kpis.total_orders,     icon: ListTree,    tone: "info",        trend: `${kpis.completed_orders} completed` },
    { label: "Active Now",     value: kpis.active_orders,    icon: Activity,    tone: "warning",     trend: "in-flight orders" },
    { label: "Volume (INR)",   value: kpis.volume_inr,       prefix: "₹",       icon: IndianRupee,   tone: "primary", trend: "lifetime" },
    { label: "Crypto Bought",  value: kpis.crypto_bought,    decimals: 4,       suffix: " USDT",     icon: Coins,     tone: "success", trend: `${kpis.crypto_today.toFixed(2)} today` },
    { label: "Success Rate",   value: kpis.success_rate,     decimals: 1,       suffix: "%",          icon: ShieldCheck, tone: "success", trend: `${kpis.completed_orders}/${kpis.total_orders}` },
    { label: "Failed/Escalated", value: kpis.failed_escalated, icon: XCircle,   tone: "destructive", trend: "needs attention" },
    { label: "Total TDS",      value: kpis.total_tds,        prefix: "₹",       icon: Receipt,       tone: "primary", trend: "deducted so far" },
    { label: "Payouts",        value: kpis.total_payouts,    icon: Wallet,      tone: "success",     trend: `₹${kpis.total_paid_out.toLocaleString("en-IN")} paid` },
    { label: "Ads Tracked",    value: kpis.total_ads,        icon: Megaphone,   tone: "info",        trend: "from incoming orders" },
    { label: "Volume Today",   value: kpis.volume_today,     prefix: "₹",       icon: CalendarDays,  tone: "info",    trend: "since midnight" },
  ] : [];

  const onBotConfirm = () => { toggleBot(); setConfirm(null); };
  const onPayoutConfirm = () => { toggleAutoPayout(); setConfirm(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your P2P automation system.
          </p>
        </div>
        {kpis?.bot_name && (
          <div className="text-right">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Bot</p>
            <p className="font-semibold text-sm">{kpis.bot_name}</p>
          </div>
        )}
      </div>

      {/* System control */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className={cn(
            "surface-card rounded-2xl p-5 relative overflow-hidden transition",
            botRunning && "shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)] border-primary/30"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center",
                botRunning ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Bot Status</p>
                <p className="text-lg font-bold mt-0.5 flex items-center gap-2">
                  {botRunning ? "Running" : "Stopped"}
                  <span className={cn("h-2 w-2 rounded-full", botRunning ? "bg-success animate-pulse-glow" : "bg-muted-foreground")} />
                </p>
              </div>
            </div>
            <Toggle disabled={systemLoading} checked={botRunning} onChange={() => setConfirm("bot")} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {botRunning
              ? "Processing orders, replies and payouts automatically."
              : "Bot is OFF. New orders are still detected and stored, but no chat replies are sent."}
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="surface-card rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center",
                autoPayout ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              )}>
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Auto Payout</p>
                <p className="text-lg font-bold mt-0.5">{autoPayout ? "Enabled" : "Manual Mode"}</p>
              </div>
            </div>
            <Toggle disabled={systemLoading} checked={autoPayout} onChange={() => setConfirm("payout")} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {autoPayout ? "Payouts trigger automatically after PAN verification." : "Each payout requires manual approval."}
          </p>
        </motion.div>
      </div>

      {/* Bot timers (dashboard-tunable cancel + PAN deadlines) */}
      <BotTimersCard />

      {/* Binance backfill / reconciliation */}
      <BinanceSyncCard />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {loading || !kpis
          ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              whileHover={{ y: -3 }}
              className="surface-card rounded-xl p-4 lg:p-5 group cursor-default"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{s.label}</p>
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition group-hover:scale-110",
                  s.tone === "success" && "bg-success/15 text-success",
                  s.tone === "destructive" && "bg-destructive/15 text-destructive",
                  s.tone === "warning" && "bg-warning/15 text-warning",
                  s.tone === "info" && "bg-info/15 text-info",
                  (!s.tone || s.tone === "primary") && "bg-primary/15 text-primary",
                )}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xl lg:text-2xl font-bold tracking-tight">
                <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
              </p>
              {s.trend && (
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground inline-flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> {s.trend}
                </p>
              )}
            </motion.div>
          ))}
      </div>

      {/* States breakdown */}
      {kpis && Object.keys(kpis.states_breakdown).length > 0 && (
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListTree className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Orders by state</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(kpis.states_breakdown).map(([state, count]) => (
              <span
                key={state}
                className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-[11px] font-medium border border-border"
              >
                <span className="uppercase tracking-wider text-muted-foreground">{state.replace(/_/g, " ")}</span>
                <span className="font-bold text-foreground">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bot vs Manual provenance breakdown */}
      {kpis && (
        <div className="grid sm:grid-cols-2 gap-4">
          <ProvenanceCard
            tone="primary"
            icon={Bot}
            label="Handled by Bot"
            total={kpis.bot_processed}
            completed={kpis.bot_completed}
            failed={kpis.bot_failed}
            description="Orders that went through the full automated flow."
          />
          <ProvenanceCard
            tone="warning"
            icon={UserCog}
            label="Manual / Synced"
            total={kpis.manual_processed}
            completed={kpis.manual_completed}
            failed={kpis.manual_failed}
            description="Orders completed outside the bot or backfilled from Binance."
          />
        </div>
      )}

      <ConfirmModal
        open={confirm === "bot"}
        title={botRunning ? "Stop the bot?" : "Start the bot?"}
        description={botRunning
          ? "Order detection keeps running, but the bot will stop replying in chat until restarted."
          : "The bot will resume processing orders, chats and payouts."}
        confirmLabel={botRunning ? "Stop bot" : "Start bot"}
        destructive={botRunning}
        onConfirm={onBotConfirm}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === "payout"}
        title={autoPayout ? "Disable auto payout?" : "Enable auto payout?"}
        description={autoPayout
          ? "All payouts will require manual approval until re-enabled."
          : "Payouts will resume triggering automatically post PAN verification."}
        confirmLabel={autoPayout ? "Disable" : "Enable"}
        destructive={autoPayout}
        onConfirm={onPayoutConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
