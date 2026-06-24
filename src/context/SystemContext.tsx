import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { systemService, BotTimers, PaymentLimits, PaymentProvider } from "@/services/system.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SystemCtx {
  botRunning: boolean;
  toggleBot: () => void;
  autoPayout: boolean;
  toggleAutoPayout: () => void;
  bankVerify: boolean;
  toggleBankVerify: () => void;
  paymentProvider: PaymentProvider;
  updatePaymentProvider: (provider: PaymentProvider) => Promise<boolean>;
  autoCancelBufferMs: number;
  panTimeoutMs: number;
  panReminderMs: number;
  updateTimers: (timers: BotTimers) => Promise<boolean>;
  impsMaxAmount: number;
  neftMaxAmount: number;
  impsDailyCap: number;
  updatePaymentLimits: (limits: PaymentLimits) => Promise<boolean>;
  autoConvertEnabled: boolean;
  convertTargetAsset: string;
  toggleAutoConvert: () => Promise<boolean>;
  setConvertTarget: (symbol: string) => Promise<boolean>;
  loading: boolean;
}

const Ctx = createContext<SystemCtx | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [botRunning, setBotRunning] = useState(false);
  const [autoPayout, setAutoPayout] = useState(false);
  const [bankVerify, setBankVerify] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("razorpay");
  const [botId, setBotId] = useState<number | null>(null);
  const [autoCancelBufferMs, setAutoCancelBufferMs] = useState(60_000);
  const [panTimeoutMs, setPanTimeoutMs] = useState(600_000);
  const [panReminderMs, setPanReminderMs] = useState(300_000);
  const [impsMaxAmount, setImpsMaxAmount] = useState(100_000);
  const [neftMaxAmount, setNeftMaxAmount] = useState(200_000);
  const [impsDailyCap, setImpsDailyCap] = useState(500_000);
  const [autoConvertEnabled, setAutoConvertEnabled] = useState(false);
  const [convertTargetAsset, setConvertTargetAsset] = useState("USDT");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConfig = async () => {
    try {
      const res = await systemService.getBotConfig();
      if (res.success) {
        setBotId(res.data.id);
        setBotRunning(res.data.bot_status === 1);
        setAutoPayout(res.data.auto_payout === 1);
        setBankVerify(res.data.bank_verify_enabled === 1);
        if (res.data.payment_provider === "razorpay" || res.data.payment_provider === "paywize") {
          setPaymentProvider(res.data.payment_provider);
        }
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
        setAutoConvertEnabled(res.data.auto_convert_enabled === 1);
        if (typeof res.data.convert_target_asset === "string" && res.data.convert_target_asset) {
          setConvertTargetAsset(res.data.convert_target_asset);
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

  const toggleBankVerify = async () => {
    if (botId === null) return;
    const nextStatus = !bankVerify;
    setBankVerify(nextStatus);
    try {
      await systemService.updateBankVerify(botId, nextStatus);
      toast.success(
        nextStatus
          ? "Bank verification ON — Surepass used for account-holder name"
          : "Bank verification OFF — using Binance-provided name"
      );
    } catch (error) {
      setBankVerify(!nextStatus);
      toast.error("Failed to update bank verification");
    }
  };

  const updatePaymentProvider = async (provider: PaymentProvider): Promise<boolean> => {
    if (botId === null) return false;
    const previous = paymentProvider;
    setPaymentProvider(provider);
    try {
      await systemService.updatePaymentProvider(botId, provider);
      toast.success(
        provider === "razorpay"
          ? "Active payment provider: RazorpayX"
          : "Active payment provider: Paywize"
      );
      return true;
    } catch (error) {
      setPaymentProvider(previous);
      toast.error("Failed to update payment provider");
      return false;
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

  const toggleAutoConvert = async (): Promise<boolean> => {
    if (botId === null) return false;
    const next = !autoConvertEnabled;
    setAutoConvertEnabled(next);
    try {
      await systemService.updateAutoConvert(botId, next);
      toast.success(next ? "Auto-convert enabled" : "Auto-convert disabled");
      return true;
    } catch (error) {
      setAutoConvertEnabled(!next);
      toast.error("Failed to update auto-convert");
      return false;
    }
  };

  const setConvertTarget = async (symbol: string): Promise<boolean> => {
    if (botId === null) return false;
    const previous = convertTargetAsset;
    const sym = (symbol || "").toUpperCase();
    setConvertTargetAsset(sym);
    try {
      await systemService.updateConvertTarget(botId, sym);
      toast.success(`Convert target set to ${sym}`);
      // Re-fetch in case the backend silently rejected the symbol (not in
      // the convert_assets whitelist).
      await fetchConfig();
      return true;
    } catch (error) {
      setConvertTargetAsset(previous);
      toast.error("Failed to update convert target");
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
        bankVerify,
        toggleBankVerify,
        paymentProvider,
        updatePaymentProvider,
        autoCancelBufferMs,
        panTimeoutMs,
        panReminderMs,
        updateTimers,
        impsMaxAmount,
        neftMaxAmount,
        impsDailyCap,
        updatePaymentLimits,
        autoConvertEnabled,
        convertTargetAsset,
        toggleAutoConvert,
        setConvertTarget,
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
