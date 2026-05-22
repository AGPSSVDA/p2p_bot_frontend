import api from "@/lib/axios";

export interface SyncResult {
  status: number;
  pages: number;
  synced: number;
}

export interface SyncBinanceOrdersData {
  total: number;
  perStatus: SyncResult[];
}

export interface SyncBinanceOrdersResponse {
  success: boolean;
  message: string;
  data: SyncBinanceOrdersData;
}

export interface AdminHealthResponse {
  success: boolean;
  message: string;
  data: { db: boolean; time: string };
}

// Binance C2C order status codes for the sync filter.
export const BINANCE_STATUS = {
  WAIT_PAYMENT:  1,
  WAIT_RELEASE:  2,
  APPEALING:     3,
  COMPLETED:     4,
  CANCELLED:     6,
  SYS_CANCELLED: 7,
} as const;

export const adminService = {
  // Public health probe (no auth) — quick DB ping
  health: async (): Promise<AdminHealthResponse> => {
    const res = await api.get<AdminHealthResponse>("/admin/health");
    return res.data;
  },

  // Backfill / reconcile historical orders from Binance into the local DB
  syncBinanceOrders: async (params: {
    statuses?: number[];
    maxPages?: number;
    rowsPerPage?: number;
  } = {}): Promise<SyncBinanceOrdersResponse> => {
    const body = {
      statuses:    params.statuses ?? [BINANCE_STATUS.COMPLETED, BINANCE_STATUS.CANCELLED, BINANCE_STATUS.SYS_CANCELLED],
      maxPages:    params.maxPages ?? 20,
      rowsPerPage: params.rowsPerPage ?? 50,
    };
    const res = await api.post<SyncBinanceOrdersResponse>("/admin/sync-binance-orders", body);
    return res.data;
  },
};
