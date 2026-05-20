import api from "@/lib/axios";

export interface BotConfig {
  id: number;
  bot_status: number;
  auto_payout: number;
  bot_name: string;
  logo: string;
  auto_cancel_buffer_ms: number;
  pan_timeout_ms: number;
  pan_reminder_ms: number;
  created_at: string;
  updated_at: string;
}

export interface BotConfigResponse {
  success: boolean;
  message: string;
  data: BotConfig;
}

export interface BotTimers {
  auto_cancel_buffer_ms?: number;
  pan_timeout_ms?: number;
  pan_reminder_ms?: number;
}

export const systemService = {
  getBotConfig: async (): Promise<BotConfigResponse> => {
    const response = await api.get<BotConfigResponse>("/bot-config");
    return response.data;
  },

  updateBotStatus: async (id: number, status: boolean) => {
    const response = await api.put(`/bot-config/${id}`, { bot_status: status });
    return response.data;
  },

  updateAutoPayout: async (id: number, status: boolean) => {
    const response = await api.put(`/bot-config/${id}`, { auto_payout: status });
    return response.data;
  },

  updateTimers: async (id: number, timers: BotTimers) => {
    const response = await api.put(`/bot-config/${id}`, timers);
    return response.data;
  },
};
