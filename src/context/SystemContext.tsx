import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { systemService, BotTimers, PaymentLimits } from "@/services/system.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SystemCtx {
  botRunning: boolean;
  toggleBot: () => void;
  autoPayout: boolean;
  toggleAutoPayout: () => void;
  cashfreeBankVerify: boolean;
  toggleCashfreeBankVerify: () => void;
  autoCancelBufferMs: number;
  panTimeoutMs: number;
  panReminderMs: number;
  updateTimers: (timers: BotTimers) => Promise<boolean>;
  impsMaxAmount: number;
  neftMaxAmount: number;
  impsDailyCap: number;
  updatePaymentLimits: (limits: PaymentLimits) => Promise<boolean>;
  loading: boolean;
}

const Ctx = createContext<SystemCtx | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [botRunning, setBotRunning] = useState(false);
  const [autoPayout, setAutoPayout] = useState(false);
  const [cashfreeBankVerify, setCashfreeBankVerify] = useState(false);
  const [botId, setBotId] = useState<number | null>(null);
  const [autoCancelBufferMs, setAutoCancelBufferMs] = useState(60_000);
  const [panTimeoutMs, setPanTimeoutMs] = useState(600_000);
  const [panReminderMs, setPanReminderMs] = useState(300_000);
  const [impsMaxAmount, setImpsMaxAmount] = useState(100_000);
  const [neftMaxAmount, setNeftMaxAmount] = useState(200_000);
  const [impsDailyCap, setImpsDailyCap] = useState(500_000);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConfig = async () => {
    try {
      const res = await systemService.getBotConfig();
      if (res.success) {
        setBotId(res.data.id);
        setBotRunning(res.data.bot_status === 1);
        setAutoPayout(res.data.auto_payout === 1);
        setCashfreeBankVerify(res.data.cashfree_bank_verify_enabled === 1);
        if (typeof res.data.auto_cancel_buffer_ms === "number") {
          setAutoCancelBufferMs(res.data.auto_cancel_buffer_ms);
        }
        if (typeof res.data.pan_timeout_ms === "number") {
          setPanTimeoutMs(res.data.pan_timeout_ms);
        }
        if (typeof res.data.pan_reminder_ms === "number") {
          setPanReminderMs(res.data.pan_reminder_ms);
        }
        if (typeof res.data.imps_max_amount === "number") {
          setImpsMaxAmount(res.data.imps_max_amount);
        }
        if (typeof res.data.neft_max_amount === "number") {
          setNeftMaxAmount(res.data.neft_max_amount);
        }
        if (typeof res.data.imps_daily_cap === "number") {
          setImpsDailyCap(res.data.imps_daily_cap);
        }
      }
    } catch (error) {
      console.error("Failed to fetch bot config:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleBot = async () => {
    if (botId === null) return;
    const nextStatus = !botRunning;
    setBotRunning(nextStatus);
    try {
      await systemService.updateBotStatus(botId, nextStatus);
      toast.success(nextStatus ? "Bot is now running" : "Bot stopped");
    } catch (error) {
      setBotRunning(!nextStatus);
      toast.error("Failed to update bot status");
    }
  };

  const toggleAutoPayout = async () => {
    if (botId === null) return;
    const nextStatus = !autoPayout;
    setAutoPayout(nextStatus);
    try {
      await systemService.updateAutoPayout(botId, nextStatus);
      toast.success(nextStatus ? "Auto payout enabled" : "Auto payout disabled");
    } catch (error) {
      setAutoPayout(!nextStatus);
      toast.error("Failed to update payout settings");
    }
  };

  const toggleCashfreeBankVerify = async () => {
    if (botId === null) return;
    const nextStatus = !cashfreeBankVerify;
    setCashfreeBankVerify(nextStatus);
    try {
      await systemService.updateCashfreeBankVerify(botId, nextStatus);
      toast.success(
        nextStatus
          ? "Cashfree bank verification ON — penny-drop used for account-holder name"
          : "Cashfree bank verification OFF — using Binance-provided name"
      );
    } catch (error) {
      setCashfreeBankVerify(!nextStatus);
      toast.error("Failed to update Cashfree bank verification");
    }
  };

  const updatePaymentLimits = async (limits: PaymentLimits): Promise<boolean> => {
    if (botId === null) return false;
    const snapshot = { impsMaxAmount, neftMaxAmount, impsDailyCap };
    if (limits.imps_max_amount !== undefined) setImpsMaxAmount(limits.imps_max_amount);
    if (limits.neft_max_amount !== undefined) setNeftMaxAmount(limits.neft_max_amount);
    if (limits.imps_daily_cap  !== undefined) setImpsDailyCap(limits.imps_daily_cap);
    try {
      await systemService.updatePaymentLimits(botId, limits);
      toast.success("Payment limits updated");
      await fetchConfig();
      return true;
    } catch (error) {
      setImpsMaxAmount(snapshot.impsMaxAmount);
      setNeftMaxAmount(snapshot.neftMaxAmount);
      setImpsDailyCap(snapshot.impsDailyCap);
      toast.error("Failed to save payment limits");
      return false;
    }
  };

  const updateTimers = async (timers: BotTimers): Promise<boolean> => {
    if (botId === null) return false;
    // Optimistic update
    const snapshot = { autoCancelBufferMs, panTimeoutMs, panReminderMs };
    if (timers.auto_cancel_buffer_ms !== undefined) setAutoCancelBufferMs(timers.auto_cancel_buffer_ms);
    if (timers.pan_timeout_ms        !== undefined) setPanTimeoutMs(timers.pan_timeout_ms);
    if (timers.pan_reminder_ms       !== undefined) setPanReminderMs(timers.pan_reminder_ms);
    try {
      await systemService.updateTimers(botId, timers);
      toast.success("Bot timers updated");
      // Re-fetch to pick up server-side clamping
      await fetchConfig();
      return true;
    } catch (error) {
      setAutoCancelBufferMs(snapshot.autoCancelBufferMs);
      setPanTimeoutMs(snapshot.panTimeoutMs);
      setPanReminderMs(snapshot.panReminderMs);
      toast.error("Failed to save timers");
      return false;
    }
  };

  return (
    <Ctx.Provider
      value={{
        botRunning,
        autoPayout,
        toggleBot,
        toggleAutoPayout,
        cashfreeBankVerify,
        toggleCashfreeBankVerify,
        autoCancelBufferMs,
        panTimeoutMs,
        panReminderMs,
        updateTimers,
        impsMaxAmount,
        neftMaxAmount,
        impsDailyCap,
        updatePaymentLimits,
        loading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useSystem = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSystem must be inside SystemProvider");
  return c;
};
