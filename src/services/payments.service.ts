import api from "@/lib/axios";

export interface PaymentRow {
  id: string;
  payout_id: number;
  orderId: string;
  sellerName: string | null;
  sellerPan: string | null;
  total_order_amount: number;
  tds_amount: number;
  amount: number;
  utr: string | null;
  upi: string | null;
  method: string | null;
  status: "SUCCESS" | "PENDING" | "FAILED" | string;
  time: string;
}

export interface PaymentLimitsSnapshot {
  imps_max_amount: number;
  neft_max_amount: number;
  imps_daily_cap: number;
  imps_used_24h: number;
  imps_remaining_24h: number;
}

export interface PaymentsListData {
  total: number;
  page: number;
  limit: number;
  pages: number;
  autoPayout: number;
  summary: {
    success: number;
    pending: number;
    failed: number;
    success_amount: number;
    pending_amount: number;
  };
  paymentLimits: PaymentLimitsSnapshot;
  payments: PaymentRow[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaymentsListParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}

export const paymentsService = {
  list: async (params: PaymentsListParams = {}): Promise<PaymentsListData> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await api.get<ApiResponse<PaymentsListData>>(`/payments?${qs.toString()}`);
    return res.data.data;
  },
  approve: async (id: number, utr: string) => {
    const res = await api.post(`/payments/${id}/approve`, { utr });
    return res.data;
  },
};
