import api from "@/lib/axios";

export interface ConvertAsset {
  id: number;
  symbol: string;
  name: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConversionRow {
  id: number;
  order_no: string;
  from_asset: string;
  to_asset: string;
  from_amount: number;
  to_amount: number | null;
  rate: number | null;
  binance_quote_id: string | null;
  binance_order_id: string | null;
  status: "SUCCESS" | "PENDING" | "FAILED" | "SKIPPED" | string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversionListData {
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: {
    success: number;
    pending: number;
    failed: number;
    skipped: number;
  };
  conversions: ConversionRow[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ConversionListParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}

export const convertService = {
  listAssets: async (onlyEnabled = false): Promise<ConvertAsset[]> => {
    const qs = onlyEnabled ? "?enabled=true" : "";
    const res = await api.get<ApiResponse<ConvertAsset[]>>(`/convert/assets${qs}`);
    return res.data.data;
  },
  addAsset: async (symbol: string, name?: string, sort_order?: number) => {
    const res = await api.post(`/convert/assets`, { symbol, name, sort_order });
    return res.data;
  },
  updateAsset: async (
    symbol: string,
    patch: { name?: string; enabled?: boolean; sort_order?: number }
  ) => {
    const res = await api.patch(`/convert/assets/${symbol}`, patch);
    return res.data;
  },
  deleteAsset: async (symbol: string) => {
    const res = await api.delete(`/convert/assets/${symbol}`);
    return res.data;
  },
  listHistory: async (params: ConversionListParams = {}): Promise<ConversionListData> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await api.get<ApiResponse<ConversionListData>>(`/convert/history?${qs.toString()}`);
    return res.data.data;
  },
};
