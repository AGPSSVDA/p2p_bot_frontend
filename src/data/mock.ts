// Mock data for the P2P automation dashboard
export type OrderStatus =
  | "NEW_ORDER"
  | "WAITING_FOR_PAN"
  | "PAN_VERIFIED"
  | "PAYMENT_SENT"
  | "COMPLETED"
  | "FAILED";

export interface Order {
  id: string;
  sellerId: string;
  pan: string;
  inrAmount: number;
  cryptoAmount: number;
  asset: string;
  status: OrderStatus;
  time: string;
}

export interface Ad {
  id: string;
  name: string;
  asset: string;
  price: number;
  active: boolean;
  available: number;
}

export interface AdAnalytics {
  advNo: string;
  tradeType: "BUY" | "SELL";
  asset: string;
  fiat: string;
  totalOrders: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  totalVolume: number;
  totalCrypto: number;
  avgOrderSize: number;
  lastOrder: string;
  activeNow: number;
}

export interface PaymentLog {
  id: string;
  orderId: string;
  sellerName: string;
  upi: string;
  utr: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  retries: number;
  time: string;
}

export interface TdsRow {
  id: string;
  sellerName: string;
  pan: string;
  orderAmount: number;
  tdsDeducted: number;
  date: string;
}

const sellers = [
  "Rohan Mehta", "Priya Sharma", "Aakash Verma", "Neha Iyer", "Vikram Singh",
  "Sanya Kapoor", "Arjun Reddy", "Ishita Roy", "Karan Bhatia", "Meera Joshi",
  "Devansh Patel", "Tanvi Desai", "Yash Gupta", "Riya Nair", "Aditya Khanna",
];

const statuses: OrderStatus[] = [
  "NEW_ORDER", "WAITING_FOR_PAN", "PAN_VERIFIED", "PAYMENT_SENT", "COMPLETED", "FAILED",
];

function pad(n: number, l = 4) { return String(n).padStart(l, "0"); }
function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export const ORDERS: Order[] = Array.from({ length: 47 }).map((_, i) => {
  const inr = Math.floor(Math.random() * 480000) + 20000;
  return {
    id: `ORD-${pad(10234 - i)}`,
    sellerId: `S${pad(8841 - i)}`,
    pan: `ABCDE${pad(1234 + i, 4)}F`,
    inrAmount: inr,
    cryptoAmount: +(inr / 7250000 * 100).toFixed(6),
    asset: rand(["USDT", "BTC", "ETH"]),
    status: statuses[i % statuses.length],
    time: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
  };
});

export const ADS: Ad[] = [
  { id: "AD-001", name: "USDT Sell — IN Bank", asset: "USDT", price: 91.42, active: true, available: 12500 },
  { id: "AD-002", name: "USDT Sell — UPI", asset: "USDT", price: 91.18, active: true, available: 8400 },
  { id: "AD-003", name: "BTC Sell — IMPS", asset: "BTC", price: 7180000, active: false, available: 0.42 },
  { id: "AD-004", name: "ETH Sell — UPI", asset: "ETH", price: 312500, active: true, available: 4.2 },
  { id: "AD-005", name: "USDT Sell — Premium", asset: "USDT", price: 91.78, active: false, available: 0 },
];

export const ADS_ANALYTICS: AdAnalytics[] = [
  {
    advNo: "AD-001",
    tradeType: "SELL",
    asset: "USDT",
    fiat: "INR",
    totalOrders: 128,
    completed: 120,
    cancelled: 8,
    completionRate: 93.75,
    totalVolume: 1158200,
    totalCrypto: 12674.31,
    avgOrderSize: 9047,
    lastOrder: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    activeNow: 18,
  },
  {
    advNo: "AD-002",
    tradeType: "SELL",
    asset: "USDT",
    fiat: "INR",
    totalOrders: 96,
    completed: 91,
    cancelled: 5,
    completionRate: 94.79,
    totalVolume: 873400,
    totalCrypto: 9561.23,
    avgOrderSize: 9108,
    lastOrder: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    activeNow: 11,
  },
  {
    advNo: "AD-003",
    tradeType: "SELL",
    asset: "BTC",
    fiat: "INR",
    totalOrders: 37,
    completed: 31,
    cancelled: 6,
    completionRate: 83.78,
    totalVolume: 2657400,
    totalCrypto: 0.37,
    avgOrderSize: 71822,
    lastOrder: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
    activeNow: 4,
  },
  {
    advNo: "AD-004",
    tradeType: "SELL",
    asset: "ETH",
    fiat: "INR",
    totalOrders: 61,
    completed: 58,
    cancelled: 3,
    completionRate: 95.08,
    totalVolume: 1907500,
    totalCrypto: 6.11,
    avgOrderSize: 31270,
    lastOrder: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    activeNow: 9,
  },
  {
    advNo: "AD-005",
    tradeType: "SELL",
    asset: "USDT",
    fiat: "INR",
    totalOrders: 12,
    completed: 11,
    cancelled: 1,
    completionRate: 91.67,
    totalVolume: 109500,
    totalCrypto: 1198.5,
    avgOrderSize: 9125,
    lastOrder: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    activeNow: 1,
  },
];

export const PAYMENTS: PaymentLog[] = ORDERS.slice(0, 28).map((o, i) => ({
  id: `PAY-${pad(5000 + i)}`,
  orderId: o.id,
  sellerName: rand(sellers),
  upi: `${o.sellerId.toLowerCase()}@okhdfc`,
  utr: `UTR${pad(100000000 + i, 9)}`,
  amount: o.inrAmount,
  status: i % 7 === 0 ? "FAILED" : i % 4 === 0 ? "PENDING" : "SUCCESS",
  retries: i % 7 === 0 ? 2 : 0,
  time: o.time,
}));

export const TDS_ROWS: TdsRow[] = Array.from({ length: 38 }).map((_, i) => {
  const amt = Math.floor(Math.random() * 480000) + 20000;
  return {
    id: `TDS-${pad(2000 + i)}`,
    sellerName: rand(sellers),
    pan: `XYZAB${pad(2000 + i, 4)}K`,
    orderAmount: amt,
    tdsDeducted: +(amt * 0.01).toFixed(2),
    date: new Date(Date.now() - i * 1000 * 60 * 60 * 22).toISOString(),
  };
});

export const ANALYTICS = {
  ordersToday: 184,
  ordersMonth: 4621,
  volumeInr: 28475000,
  cryptoBought: 312.48,
  successRate: 96.4,
  failedEscalated: 12,
};

export const DEFAULT_TEMPLATES: Record<string, string[]> = {
  welcome: ["Hi {name}! Welcome. Please share your PAN to proceed with the order."],
  panRequest: ["Kindly share your PAN number (10 chars) so we can verify and release."],
  invalidPan: ["The PAN you shared seems invalid. Please re-check and send again."],
  panFailed: ["PAN verification failed. Please share a different valid PAN."],
  panVerified: ["PAN verified ✅. Initiating payment shortly."],
  paymentSent: ["Payment sent ✅. UTR: {utr}. Please confirm receipt."],
  reminder: ["Friendly reminder — please share your PAN to avoid order cancellation."],
  finalWarning: ["Final warning — order will be auto-cancelled in 5 minutes if PAN is not shared."],
  fallback: ["Our team will get back shortly. Thank you for your patience."],
};

