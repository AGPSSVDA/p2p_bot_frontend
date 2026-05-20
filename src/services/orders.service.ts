import api from "@/lib/axios";

export type OrderState =
  | "NEW_ORDER"
  | "WAITING_FOR_PAN"
  | "VALIDATING_PAN"
  | "PAN_VERIFIED"
  | "WAITING_TDS_CONSENT"
  | "TDS_ACCEPTED"
  | "PROCESSING_PAYMENT"
  | "AWAITING_MANUAL_PAYMENT"
  | "PAYMENT_SENT"
  | "WAITING_FOR_RELEASE"
  | "COMPLETED"
  | "ESCALATED"
  | "FAILED"
  | "CANCELLED";

export interface OrderRow {
  id: string;
  order_no: string;
  adv_no: string | null;
  asset: string | null;
  fiat: string | null;
  amount: number;
  crypto_amount: number;
  seller_nickname: string | null;
  seller_user_id: string | null;
  seller_name: string | null;
  pan: string | null;
  pan_full: string | null;
  pan_name: string | null;
  pan_retries: number;
  name_match_status: string | null;
  payment_method: string | null;
  upi_id: string | null;
  account_no: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  account_name: string | null;
  pre_tds_amount: number;
  tds_amount: number;
  post_tds_amount: number;
  payout_id: string | null;
  utr_number: string | null;
  confirm_pay_end_time: string | null;
  notify_pay_end_time: string | null;
  state: OrderState;
  cancel_reason: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  escalated_at: string | null;
  processed_by: "BOT" | "MANUAL" | string;
  created_at: string;
  updated_at: string;
  is_live: boolean;
}

export interface OrderListData {
  total: number;
  page: number;
  limit: number;
  pages: number;
  orders: OrderRow[];
}

export interface OrderStateLogEntry {
  from_state: OrderState | null;
  to_state: OrderState;
  reason: string | null;
  created_at: string;
}

export interface OrderMessageEntry {
  direction: "IN" | "OUT";
  sender: string | null;
  template_key: string | null;
  message_text: string;
  sent_status: string | null;
  created_at: string;
}

export interface OrderDetailData {
  order: OrderRow;
  state_log: OrderStateLogEntry[];
  messages: OrderMessageEntry[];
  live: {
    state: OrderState;
    reminderSent: boolean;
    lastWarningSent: boolean;
    panRetries: number;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  processed_by?: "BOT" | "MANUAL" | string;
}

export const ordersService = {
  list: async (params: OrderListParams = {}): Promise<OrderListData> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await api.get<ApiResponse<OrderListData>>(`/orders?${qs.toString()}`);
    return res.data.data;
  },
  get: async (orderNo: string): Promise<OrderDetailData> => {
    const res = await api.get<ApiResponse<OrderDetailData>>(`/orders/${orderNo}`);
    return res.data.data;
  },
  cancel: async (orderNo: string, reasonCode = 6, additionalInfo = "Manual cancel from dashboard") => {
    const res = await api.post(`/orders/${orderNo}/cancel`, { reasonCode, additionalInfo });
    return res.data;
  },
};
