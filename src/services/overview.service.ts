import api from "@/lib/axios";

export interface OverviewKpis {
  orders_today: number;
  orders_month: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  failed_escalated: number;
  success_rate: number;
  volume_inr: number;
  volume_today: number;
  volume_month: number;
  crypto_bought: number;
  crypto_today: number;
  total_tds: number;
  total_payouts: number;
  total_paid_out: number;
  total_ads: number;
  states_breakdown: Record<string, number>;
  active_states: string[];
  failure_states: string[];
  bot_status: number;
  auto_payout: number;
  bot_name: string | null;
}

export interface DailySeriesPoint {
  day: string;
  orders: number;
  completed: number;
  volume: number;
  crypto: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const overviewService = {
  getOverview: async (): Promise<OverviewKpis> => {
    const res = await api.get<ApiResponse<OverviewKpis>>("/overview");
    return res.data.data;
  },
  getDailySeries: async (days = 30): Promise<DailySeriesPoint[]> => {
    const res = await api.get<ApiResponse<DailySeriesPoint[]>>(`/overview/daily?days=${days}`);
    return res.data.data;
  },
};
