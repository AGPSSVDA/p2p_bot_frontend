import api from "@/lib/axios";

export interface TdsRecord {
  sr_no: number;
  id: number;
  order_id: string;
  date: string;
  date_display: string;
  name: string;
  pan: string;
  amount: number;
  tds_deducted: number;
  tds_deposited: number;
  status: string;
}

export interface TdsListData {
  summary: { records: number; payout_volume: number; total_tds: number };
  records: TdsRecord[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type TdsPeriod = "ALL" | "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

export interface TdsListParams {
  period?: TdsPeriod;
  from?: string;
  to?: string;
  q?: string;
}

export const tdsService = {
  list: async (params: TdsListParams = {}): Promise<TdsListData> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await api.get<ApiResponse<TdsListData>>(`/tds?${qs.toString()}`);
    return res.data.data;
  },
  exportUrl: (params: TdsListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    return `/tds/export?${qs.toString()}`;
  },
};
