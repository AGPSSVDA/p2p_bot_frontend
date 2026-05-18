import api from "@/lib/axios";

export interface AdRow {
  advNo: string;
  tradeType: string;
  asset: string | null;
  fiat: string | null;
  price: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  status: string | null;
  totalOrders: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  totalVolume: number;
  totalCrypto: number;
  avgOrderSize: number;
  activeNow: number;
  lastOrder: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastSyncedAt: string | null;
}

export interface AdsListData {
  summary: {
    totalAds: number;
    totalOrders: number;
    activeNow: number;
    avgCompletionRate: number;
  };
  ads: AdRow[];
  liveAdsFetched: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adsService = {
  list: async (): Promise<AdsListData> => {
    const res = await api.get<ApiResponse<AdsListData>>("/ads");
    return res.data.data;
  },
};
