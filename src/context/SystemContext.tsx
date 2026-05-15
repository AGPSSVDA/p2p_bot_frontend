import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { systemService } from "@/services/system.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SystemCtx {
  botRunning: boolean;
  toggleBot: () => void;
  autoPayout: boolean;
  toggleAutoPayout: () => void;
  loading: boolean;
}

const Ctx = createContext<SystemCtx | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [botRunning, setBotRunning] = useState(false);
  const [autoPayout, setAutoPayout] = useState(false);
  const [botId, setBotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConfig = async () => {
    try {
      const res = await systemService.getBotConfig();
      if (res.success) {
        setBotId(res.data.id);
        setBotRunning(res.data.bot_status === 1);
        setAutoPayout(res.data.auto_payout === 1);
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

  return (
    <Ctx.Provider
      value={{
        botRunning,
        autoPayout,
        toggleBot,
        toggleAutoPayout,
        loading
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
