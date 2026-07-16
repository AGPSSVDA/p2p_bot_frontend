import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sellerService } from '@/services/seller.service';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface EligibilityCheckModalProps {
  orderNo: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EligibilityCheckModal({
  orderNo,
  isOpen,
  onClose,
}: EligibilityCheckModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEligibilityDetails();
    }
  }, [isOpen, orderNo]);

  const loadEligibilityDetails = async () => {
    try {
      setLoading(true);
      const details = await sellerService.getEligibilityCheckDetails(orderNo);
      setData(details);
      setError(null);
    } catch (err) {
      setError('Failed to load eligibility details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  const passedCount = data.criteria?.filter((c: any) => c.passed).length || 0;
  const totalCount = data.criteria?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800">
        <DialogHeader className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-800 sticky top-0 z-10">
          <DialogTitle className="text-xl font-bold text-white">
            Eligibility Check Details
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-2">Order #{orderNo}</p>
        </DialogHeader>

        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading...</div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Buyer Info */}
            <div className="bg-blue-900/30 border border-blue-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-300 mb-3">👤 Buyer Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Buyer ID</span>
                  <p className="font-mono text-white break-all">{data.buyer.id}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Nickname</span>
                  <p className="font-bold text-white">{data.buyer.nickname}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400">KYC Name</span>
                  <p className="text-white">{data.buyer.kycName || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Ad Info */}
            <div className="bg-indigo-900/30 border border-indigo-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-300 mb-3">📋 Ad Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Ad No</span>
                  <p className="font-mono text-white">{data.ad.adNo}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Asset</span>
                  <p className="font-bold text-white">{data.ad.asset}/{data.ad.fiatUnit}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400">Classify</span>
                  <p className="text-white capitalize">{data.ad.classify}</p>
                </div>
              </div>
            </div>

            {/* Eligibility Status */}
            <div className={`border p-4 rounded-lg ${
              data.eligibility.passed
                ? 'bg-green-900/30 border-green-800/50'
                : 'bg-red-900/30 border-red-800/50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {data.eligibility.passed ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-300">✓ Eligibility Passed</h3>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-300">✗ Eligibility Failed</h3>
                  </>
                )}
              </div>
              {!data.eligibility.passed && data.eligibility.failedReason && (
                <p className="text-sm text-slate-300 bg-black/30 p-2 rounded">
                  {data.eligibility.failedReason}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Checked: {new Date(data.eligibility.checkedAt).toLocaleString()}
              </p>
            </div>

            {/* Eligibility Criteria */}
            <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-300 mb-3">
                🎯 Eligibility Criteria ({passedCount}/{totalCount})
              </h3>
              <div className="space-y-2">
                {data.criteria?.map((criterion: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${
                      criterion.passed
                        ? 'bg-green-900/20 border-green-800/30'
                        : 'bg-red-900/20 border-red-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {criterion.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{criterion.criterion}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                          <div>
                            <span className="text-xs text-slate-400">Required</span>
                            <p className="text-white font-mono">{criterion.required}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400">Actual</span>
                            <p className="text-white font-mono">{criterion.actual}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Metrics */}
            {data.buyerMetrics && (
              <div className="bg-purple-900/30 border border-purple-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-300 mb-3">📊 Buyer Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">30-Day Trades</span>
                    <p className="font-bold text-white">{data.buyerMetrics.trades30Day}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Completion Rate</span>
                    <p className="font-bold text-white">{data.buyerMetrics.completionRate}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Registered Days</span>
                    <p className="font-bold text-white">{data.buyerMetrics.registeredDays} days</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Trading Counterparties</span>
                    <p className="font-bold text-white">{data.buyerMetrics.tradingCounterparties}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">All Trades Count</span>
                    <p className="font-bold text-white">{data.buyerMetrics.allTradesCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Buy Orders</span>
                    <p className="font-bold text-white">{data.buyerMetrics.buyOrdersCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Sell Orders</span>
                    <p className="font-bold text-white">{data.buyerMetrics.sellOrdersCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Avg Release Time</span>
                    <p className="font-bold text-white">{data.buyerMetrics.avgReleaseTime} min</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Avg Pay Time</span>
                    <p className="font-bold text-white">{data.buyerMetrics.avgPayTime} min</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
