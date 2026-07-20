import api from '@/lib/axios';

export interface SellerAd {
  id: number;
  adNo: string;
  asset: string;
  fiatUnit: string;
  fiatSymbol: string;
  price: number;
  priceType: number;  // 1=FIXED, 2=FLOATING
  priceFloatingRatio: number;
  commissionRate: number;
  minOrder: number;
  maxOrder: number;
  surplusAmount: number;
  initAmount: number;
  classify: string;
  tradeType: string;
  isActive: boolean;
  advStatus: number;
  remarks: string;
  autoReplyMsg: string;
  payTimeLimit: number;
  offlineReason: string;
  assetScale: number;
  fiatScale: number;
  priceScale: number;
  buyerKycRequired: boolean;
  buyerRegDaysLimit: number;
  buyerBtcPositionLimit: number;
  userBuyTradeCountMin: number;
  userBuyTradeCountMax: number;
  userSellTradeCountMin: number;
  userSellTradeCountMax: number;
  userAllTradeCountMin: number;
  userAllTradeCountMax: number;
  userTradeCompleteCountMin: number;
  userTradeCompleteRateMin: number;
  userTradeVolumeMin: number;
  userTradeVolumeMax: number;
  createdAt: string;
  updatedAt: string;
  tradeMethods: TradeMethod[];
  rules: SellerAdRules;
  summary: RuleSummary;
}

export interface TradeMethod {
  payId: number;
  payType: string;
  identifier: string;
  tradeMethodName: string;
  iconUrl: string;
  iconUrlColor: string;
  commissionRate: number;
}

export interface TradeTypeOption {
  id: number;
  trade_type_name: string;
}

export interface SellerAdRules {
  eligibility: EligibilityRules;
  methods: VerificationMethods;
}

export interface CriterionValue {
  enabled: boolean;
  value: number | string;
}

/** Ads list filter: "live" = Online on Binance only, "all" = everything. */
export type AdStatusFilter = 'live' | 'all';

export interface AdCounts {
  all: number;
  live: number;
}

export interface EligibilityRules {
  min30dayTrades: CriterionValue | number;
  min30dayCompletionRate: CriterionValue | number;
  minRegisteredDays: CriterionValue | number;
  minAllTradesCount: CriterionValue | number;
  minBuyOrdersCount: CriterionValue | number;
  minSellOrdersCount: CriterionValue | number;
  minTradeVolume: CriterionValue | number;
  maxTradeVolume: CriterionValue | number;
  minBtcHolding: CriterionValue | number;

  // Legacy criteria: not supported by Binance and not shown in the UI, but the
  // DB columns still exist and updateAdRules() still forwards them. Optional so
  // existing callers keep compiling.
  maxAvgReleaseTime?: CriterionValue | number;
  maxAvgPayTime?: CriterionValue | number;
  requiredTradeType?: CriterionValue | string;
  minFirstTradeDays?: CriterionValue | number;
  minTradingCounterparty?: CriterionValue | number;
}

export interface VerificationMethods {
  method1: {
    name: string;
    enabled: boolean;
  };
  method2: {
    name: string;
    enabled: boolean;
    mobileVerification: boolean;
  };
  method3: {
    name: string;
    enabled: boolean;
    mobileVerification: boolean;
    paymentLink: boolean;
    paymentGateway: string;
    deliveryMethod: string;
  };
}

export interface RuleSummary {
  methods: string;
  minTradesCount: number;
  minCompletionRate: number;
  minRegisteredDays: number;
}

export interface SellerOrder {
  id: number;
  orderNo: string;
  buyerId: string;
  buyerNickname: string;
  adNo: string;
  cryptoAmount: number;
  fiatAmount: number;
  asset: string;
  fiatUnit: string;
  currentState: string;
  eligibilityCheckPassed: boolean;
  livenessCompleted: boolean;
  documentsVerified: boolean;
  orderVerifiedAt: string | null;
  paymentReceivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimeline;
}

export interface OrderTimeline {
  eligibilityCheckAt: string | null;
  livenessRequestedAt: string | null;
  documentsRequestedAt: string | null;
  orderVerifyAttemptedAt: string | null;
  paymentLinkSentAt: string | null;
}

/** An image the buyer uploaded in the Binance order chat (Method 2). */
export interface OrderDocumentImage {
  id: number;
  /** null until a later phase classifies Aadhaar vs PAN */
  type: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  imageType: string | null;
  width: number | null;
  height: number | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
  status: string | null;
  error: string | null;
}

export interface OrderDocuments {
  requestedAt: string | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
  count: number;
  documents: OrderDocumentImage[];
}

/**
 * Shape returned by GET /api/seller/orders/:orderNo — this is nested and does
 * NOT match the flat SellerOrder list shape, so it is declared standalone.
 */
export interface OrderDetail {
  id: number;
  orderNo: string;
  sellerId: number;
  buyerId: string;
  buyerNickname: string;
  buyerKycName: string;
  adNo: string;
  crypto: { amount: number; asset: string };
  fiat: { amount: number; unit: string };
  currentState: string;
  eligibility: {
    checkedAt: string | null;
    passed: boolean | null;
    failedReason: string | null;
  };
  liveness: {
    requestedAt: string | null;
    completedAt: string | null;
    passed: boolean;
  };
  documents: OrderDocuments;
  mobileOtp: { requestedAt: string | null; verifiedAt: string | null };
  orderVerification: {
    attemptedAt: string | null;
    verifiedAt: string | null;
    failedReason: string | null;
  };
  payment: {
    linkGeneratedAt: string | null;
    sentAt: string | null;
    receivedAt: string | null;
    gateway: string | null;
    deliveryMethod: string | null;
    history: PaymentHistoryEntry[];
  };
  thankYou: { sentAt: string | null };
  timeline: {
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  };
  stateHistory: StateHistory[];
  messages: OrderMessage[];
}

export interface PaymentHistoryEntry {
  method: string | null;
  amount: number | null;
  status: string | null;
  transactionId: string | null;
  utr: string | null;
  error: string | null;
  initiatedAt: string | null;
  completedAt: string | null;
}

export interface StateHistory {
  from: string;
  to: string;
  reason: string | null;
  timestamp: string;
}

export interface OrderMessage {
  direction?: string;
  sender?: string;
  messageType: string;
  content: string;
  sentAt: string;
}

export interface OrderTimeline {
  orderNo: string;
  currentState: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  step: string | number;
  event: string;
  timestamp: string;
  status: string;
  detail?: string;
}

export interface DashboardOverview {
  timestamp: string;
  summary: {
    ads: { total: number; active: number; inactive: number };
    orders: {
      total: number;
      completed: number;
      rejected: number;
      active: number;
      eligible: number;
      ineligible: number;
    };
    volume: {
      fiat: { total: number; currency: string };
      crypto: { total: number; asset: string };
      transactions: number;
    };
  };
  verification: {
    liveness: { completed: number };
    documents: { verified: number };
    otp: { verified: number };
    orderVerification: { completed: number };
    payment: { received: number };
  };
  orders: {
    byState: Record<string, number>;
    recent: RecentOrder[];
  };
  ads: {
    list: AdOverview[];
    topPerforming: TopAd[];
  };
  health: {
    conversionRate: number;
    eligibilityPassRate: number;
    avgOrderValue: number;
  };
}

export interface RecentOrder {
  orderNo: string;
  buyerNickname: string;
  adNo: string;
  fiatAmount: number;
  cryptoAmount: number;
  asset: string;
  state: string;
  eligible: boolean;
  createdAt: string;
}

export interface AdOverview {
  adNo: string;
  asset: string;
  fiatUnit: string;
  price: number;
  isActive: boolean;
  summary: RuleSummary;
}

export interface TopAd {
  adNo: string;
  orderCount: number;
  completedCount: number;
  completionRate: number;
  totalVolume: number;
}

export interface HealthMetrics {
  totalOrders: number;
  completionRate: number;
  rejectionRate: number;
  eligibilityPassRate: number;
  avgLivenessTimeMinutes: number;
  avgDocumentVerifyTimeMinutes: number;
  lastOrderTime: string;
  lastOrderDate: string;
  score: number;
}

export interface OrderStats {
  totalOrders: number;
  byState: Record<string, number>;
  eligibleOrders: number;
  ineligibleOrders: number;
  documentsVerifiedOrders: number;
  completedOrders: number;
  totalFiatProcessed: number;
  totalCryptoProcessed: number;
  byAd: AdStat[];
}

export interface AdStat {
  adNo: string;
  orderCount: number;
  eligibleCount: number;
  completedCount: number;
}

export interface ActivityLog {
  orderNo: string;
  fromState: string;
  toState: string;
  reason: string;
  timestamp: string;
}

class SellerService {
  // ===== DASHBOARD ENDPOINTS =====

  async getDashboard() {
    const res = await api.get<{ success: boolean; data: DashboardOverview }>('/seller/dashboard');
    return { success: res.data.success, data: res.data.data };
  }

  async getHealthMetrics() {
    const res = await api.get<{ success: boolean; data: HealthMetrics }>('/seller/dashboard/health');
    return { success: res.data.success, data: res.data.data };
  }

  async getActivityLog(limit?: number) {
    const params = limit ? { limit } : {};
    const res = await api.get<{ success: boolean; data: ActivityLog[] }>('/seller/dashboard/activity', { params });
    return { success: res.data.success, data: res.data.data };
  }

  // ===== ADS ENDPOINTS =====

  /**
   * Fetch seller ads.
   * @param status "live" = only ads Online on Binance, "all" = every ad (default)
   */
  async getAds(status: AdStatusFilter = 'all') {
    const res = await api.get<{
      success: boolean;
      data: SellerAd[];
      counts?: AdCounts;
    }>('/seller/ads', { params: { status } });
    return {
      success: res.data.success,
      data: res.data.data,
      counts: res.data.counts ?? { all: 0, live: 0 },
    };
  }

  async getAdDetail(adNo: string) {
    const res = await api.get<{ success: boolean; data: SellerAd }>(`/seller/ads/${adNo}`);
    return { success: res.data.success, data: res.data.data };
  }

  async updateAdRules(adNo: string, rules: Partial<SellerAdRules>) {
    const extractValue = (criterion: any) => {
      if (!criterion) return 0;
      if (typeof criterion === 'object' && criterion !== null && 'value' in criterion) {
        const val = criterion.value;
        // If value is an object, return default
        if (typeof val === 'object') return 'ANY';
        // Handle string numbers
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? val : parsed;
        }
        return val;
      }
      // If criterion is an object but not our {enabled, value} format, return default
      if (typeof criterion === 'object') return 'ANY';
      return criterion;
    };

    const extractEnabled = (criterion: any) => {
      if (!criterion) return false; // DEFAULT OFF
      if (typeof criterion === 'object' && 'enabled' in criterion) {
        return criterion.enabled === true || criterion.enabled === 1; // Handle both boolean and number (1/0 from DB)
      }
      return false; // DEFAULT OFF
    };

    const extractMethodEnabled = (value: any) => {
      if (value === undefined || value === null) return false;
      return value === true || value === 1; // Handle both boolean and number
    };

    const payload = {
      // Eligibility fields - each criterion has enabled flag + value
      min_30day_trades_enabled: extractEnabled(rules.eligibility?.min30dayTrades),
      min_30day_trades: extractValue(rules.eligibility?.min30dayTrades),

      min_30day_completion_rate_enabled: extractEnabled(rules.eligibility?.min30dayCompletionRate),
      min_30day_completion_rate: extractValue(rules.eligibility?.min30dayCompletionRate),

      max_avg_release_time_enabled: extractEnabled(rules.eligibility?.maxAvgReleaseTime),
      max_avg_release_time: extractValue(rules.eligibility?.maxAvgReleaseTime),

      max_avg_pay_time_enabled: extractEnabled(rules.eligibility?.maxAvgPayTime),
      max_avg_pay_time: extractValue(rules.eligibility?.maxAvgPayTime),

      required_trade_type_enabled: extractEnabled(rules.eligibility?.requiredTradeType),
      required_trade_type: typeof extractValue(rules.eligibility?.requiredTradeType) === 'string'
        ? extractValue(rules.eligibility?.requiredTradeType)
        : 'ANY',

      min_registered_days_enabled: extractEnabled(rules.eligibility?.minRegisteredDays),
      min_registered_days: extractValue(rules.eligibility?.minRegisteredDays),

      min_first_trade_days_enabled: extractEnabled(rules.eligibility?.minFirstTradeDays),
      min_first_trade_days: extractValue(rules.eligibility?.minFirstTradeDays),

      min_trading_counterparty_enabled: extractEnabled(rules.eligibility?.minTradingCounterparty),
      min_trading_counterparty: extractValue(rules.eligibility?.minTradingCounterparty),

      min_all_trades_count_enabled: extractEnabled(rules.eligibility?.minAllTradesCount),
      min_all_trades_count: extractValue(rules.eligibility?.minAllTradesCount),

      min_buy_orders_count_enabled: extractEnabled(rules.eligibility?.minBuyOrdersCount),
      min_buy_orders_count: extractValue(rules.eligibility?.minBuyOrdersCount),

      min_sell_orders_count_enabled: extractEnabled(rules.eligibility?.minSellOrdersCount),
      min_sell_orders_count: extractValue(rules.eligibility?.minSellOrdersCount),

      // Method 1
      method1_liveness_enabled: extractMethodEnabled(rules.methods?.method1?.enabled),

      // Method 2
      method2_documents_enabled: extractMethodEnabled(rules.methods?.method2?.enabled),
      method2_mobile_verification_enabled: extractMethodEnabled(rules.methods?.method2?.mobileVerification),

      // Method 3
      method3_full_enabled: extractMethodEnabled(rules.methods?.method3?.enabled),
      method3_mobile_verification_enabled: extractMethodEnabled(rules.methods?.method3?.mobileVerification),
      method3_payment_link_enabled: extractMethodEnabled(rules.methods?.method3?.paymentLink),
      method3_payment_gateway: rules.methods?.method3?.paymentGateway || 'razorpay',
      method3_delivery_method: rules.methods?.method3?.deliveryMethod || 'payment_link',
    };

    const res = await api.put(`/seller/ads/${adNo}/rules`, payload);
    return res.data;
  }

  /**
   * ELIGIBILITY ONLY -> syncs buyer-eligibility criteria to the Binance ad.
   * Verification methods are NOT sent here (see updateAdMethods).
   */
  async syncEligibilityToBinance(adNo: string, rules: Partial<SellerAdRules>) {
    // Send only the eligibility block; methods have no Binance equivalent.
    const res = await api.post(`/seller/ads/${adNo}/sync-eligibility`, {
      rules: { eligibility: rules.eligibility },
    });
    return res.data;
  }

  /**
   * METHODS ONLY -> saves verification method toggles to our DB.
   *
   * Methods are bot-side behaviour applied AFTER an order arrives (Method 1 =
   * liveness, Method 2 = liveness + chat documents, Method 3 = full). Binance
   * has no concept of them, so this never touches the Binance API — and keeps
   * working even when a Binance ad update is rejected.
   */
  async updateAdMethods(adNo: string, rules: Partial<SellerAdRules>) {
    const res = await api.put(`/seller/ads/${adNo}/methods`, {
      methods: rules.methods,
    });
    return res.data;
  }

  async toggleAd(adNo: string, isActive: boolean) {
    const res = await api.post(`/seller/ads/${adNo}/toggle`, { isActive });
    return res.data;
  }

  // ===== TRADE TYPES ENDPOINTS =====

  async getTradeTypes() {
    const res = await api.get<{ success: boolean; data: TradeTypeOption[] }>('/seller/trade-types');
    return res.data.data;
  }

  async createTradeType(tradeTypeName: string) {
    const res = await api.post(`/seller/trade-types`, { tradeTypeName });
    return res.data;
  }

  async deleteTradeType(tradeTypeName: string) {
    const res = await api.delete(`/seller/trade-types/${tradeTypeName}`);
    return res.data;
  }

  // ===== ORDERS ENDPOINTS =====

  async getOrders(params?: {
    limit?: number;
    offset?: number;
    state?: string;
    adNo?: string;
  }) {
    const res = await api.get<{
      success: boolean;
      data: SellerOrder[];
      count: number;
      pagination: { limit: number; offset: number };
    }>('/seller/orders', { params });
    return res.data;
  }

  async getOrderDetail(orderNo: string) {
    const res = await api.get<{ success: boolean; data: OrderDetail }>(`/seller/orders/${orderNo}`);
    return { success: res.data.success, data: res.data.data };
  }

  async getOrderStats() {
    const res = await api.get<{ success: boolean; data: OrderStats }>('/seller/orders/stats/summary');
    return { success: res.data.success, data: res.data.data };
  }

  async getOrderTimeline(orderNo: string) {
    const res = await api.get<{ success: boolean; data: OrderTimeline }>(`/seller/orders/timeline/${orderNo}`);
    return { success: res.data.success, data: res.data.data };
  }

  async getEligibilityCheckDetails(orderNo: string) {
    const res = await api.get<{ success: boolean; data: any }>(`/seller/orders/${orderNo}/eligibility-check`);
    return res.data.data;
  }

  // ===== SYNC ENDPOINTS =====

  async syncAdsFromBinance() {
    const res = await api.post<{ success: boolean; data: any }>('/seller/sync/ads', {});
    return res.data;
  }

  async getSyncStatus() {
    const res = await api.get<{ success: boolean; data: any }>('/seller/sync/status');
    return res.data;
  }
}

export const sellerService = new SellerService();
