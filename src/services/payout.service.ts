import api from "@/lib/axios";

export interface Payout {
  date: string;
  name?: string; // User requested "NAME" column
  pan: string;
  amount: string;
  tds_deducted: string;
  tds_deposited: string;
  status: string;
}

export interface PayoutResponse {
  success: boolean;
  message: string;
  data: Payout[];
}

export const payoutService = {
  getPayouts: async (): Promise<PayoutResponse> => {
    const response = await api.get<PayoutResponse>("/payouts");
    return response.data;
  }
};
