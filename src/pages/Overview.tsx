import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, ArrowUpRight, Bot, Coins, IndianRupee, ShieldCheck,
  TrendingUp, XCircle, Zap, Pause, Play,
} from "lucide-react";
import { ANALYTICS } from "@/data/mock";
import { useSystem } from "@/context/SystemContext";
import { Toggle } from "@/components/Toggle";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CardSkeleton } from "@/components/Skeletons";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  icon: typeof Bot; trend?: string; tone?: "primary" | "success" | "warning" | "destructive";
}

export default function Overview() {
  const { botRunning, autoPayout, toggleBot, toggleAutoPayout, loading: systemLoading } = useSystem();
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<null | "bot" | "payout">(null);

  useEffect(() => {
    if (!systemLoading) {
      setLoading(false);
    }
  }, [systemLoading]);

  const stats: StatCard[] = [
    { label: "Orders Today",   value: ANALYTICS.ordersToday, icon: Activity, trend: "+12.4%", tone: "primary" },
    { label: "Orders (Month)", value: ANALYTICS.ordersMonth, icon: TrendingUp, trend: "+8.1%", tone: "success" },
    { label: "Volume (INR)",   value: ANALYTICS.volumeInr, prefix: "₹", icon: IndianRupee, trend: "+22%", tone: "primary" },
    { label: "Crypto Bought",  value: ANALYTICS.cryptoBought, decimals: 2, suffix: " USDT", icon: Coins, trend: "+5.6%", tone: "success" },
    { label: "Success Rate",   value: ANALYTICS.successRate, decimals: 1, suffix: "%", icon: ShieldCheck, trend: "Stable", tone: "success" },
    { label: "Failed/Escalated", value: ANALYTICS.failedEscalated, icon: XCircle, trend: "-3", tone: "destructive" },
  ];



  const onBotConfirm = () => {
    toggleBot();
    setConfirm(null);
  };
  const onPayoutConfirm = () => {
    toggleAutoPayout();
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your P2P automation system.
          </p>
        </div>
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
            {botRunning ? "Processing orders, replies and payouts automatically." : "Bot is idle. New orders will queue."}
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

      {/* Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
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
                  (!s.tone || s.tone === "primary") && "bg-primary/15 text-primary",
                )}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xl lg:text-2xl font-bold tracking-tight">
                <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
              </p>
              {s.trend && (
                <p className={cn(
                  "mt-1.5 text-[11px] font-semibold inline-flex items-center gap-1",
                  s.tone === "destructive" ? "text-destructive" : "text-success"
                )}>
                  <ArrowUpRight className="h-3 w-3" /> {s.trend}
                </p>
              )}
            </motion.div>
          ))}
      </div>



      <ConfirmModal
        open={confirm === "bot"}
        title={botRunning ? "Stop the bot?" : "Start the bot?"}
        description={botRunning
          ? "New incoming orders will be queued until the bot is restarted."
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
