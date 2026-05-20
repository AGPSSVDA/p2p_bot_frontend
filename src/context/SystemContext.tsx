import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { systemService, BotTimers } from "@/services/system.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SystemCtx {
  botRunning: boolean;
  toggleBot: () => void;
  autoPayout: boolean;
  toggleAutoPayout: () => void;
  autoCancelBufferMs: number;
  panTimeoutMs: number;
  panReminderMs: number;
  updateTimers: (timers: BotTimers) => Promise<boolean>;
  loading: boolean;
}

const Ctx = createContext<SystemCtx | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [botRunning, setBotRunning] = useState(false);
  const [autoPayout, setAutoPayout] = useState(false);
  const [botId, setBotId] = useState<number | null>(null);
  const [autoCancelBufferMs, setAutoCancelBufferMs] = useState(60_000);
  const [panTimeoutMs, setPanTimeoutMs] = useState(600_000);
  const [panReminderMs, setPanReminderMs] = useState(300_000);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConfig = async () => {
    try {
      const res = await systemService.getBotConfig();
      if (res.success) {
        setBotId(res.data.id);
        setBotRunning(res.data.bot_status === 1);
        setAutoPayout(res.data.auto_payout === 1);
        if (typeof res.data.auto_cancel_buffer_ms === "number") {
          setAutoCancelBufferMs(res.data.auto_cancel_buffer_ms);
        }
        if (typeof res.data.pan_timeout_ms === "number") {
          setPanTimeoutMs(res.data.pan_timeout_ms);
        }
        if (typeof res.data.pan_reminder_ms === "number") {
          setPanReminderMs(res.data.pan_reminder_ms);
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
        autoCancelBufferMs,
        panTimeoutMs,
        panReminderMs,
        updateTimers,
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
