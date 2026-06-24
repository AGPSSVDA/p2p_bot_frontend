import api from "@/lib/axios";

export type PaymentProvider = "razorpay" | "paywize";

export interface BotConfig {
  id: number;
  bot_status: number;
  auto_payout: number;
  bank_verify_enabled: number;
  payment_provider: PaymentProvider;
  bot_name: string;
  logo: string;
  auto_cancel_buffer_ms: number;
  pan_timeout_ms: number;
  pan_reminder_ms: number;
  imps_max_amount: number;
  neft_max_amount: number;
  imps_daily_cap: number;
  auto_convert_enabled: number;
  convert_target_asset: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentLimits {
  imps_max_amount?: number;
  neft_max_amount?: number;
  imps_daily_cap?: number;
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

  updateBankVerify: async (id: number, status: boolean) => {
    const response = await api.put(`/bot-config/${id}`, {
      bank_verify_enabled: status,
    });
    return response.data;
  },

  updatePaymentProvider: async (id: number, provider: PaymentProvider) => {
    const response = await api.put(`/bot-config/${id}`, {
      payment_provider: provider,
    });
    return response.data;
  },

  updateTimers: async (id: number, timers: BotTimers) => {
    const response = await api.put(`/bot-config/${id}`, timers);
    return response.data;
  },

  updatePaymentLimits: async (id: number, limits: PaymentLimits) => {
    const response = await api.put(`/bot-config/${id}`, limits);
    return response.data;
  },

  updateAutoConvert: async (id: number, enabled: boolean) => {
    const response = await api.put(`/bot-config/${id}`, {
      auto_convert_enabled: enabled,
    });
    return response.data;
  },

  updateConvertTarget: async (id: number, symbol: string) => {
    const response = await api.put(`/bot-config/${id}`, {
      convert_target_asset: symbol,
    });
    return response.data;
  },
};
