import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Edit2, Power, RefreshCw } from 'lucide-react';
import { sellerService, SellerAd } from '@/services/seller.service';
import { Skeleton } from '@/components/Skeletons';
import AdDetailsModal from '@/components/seller/AdDetailsModal';

export default function SellerAds() {
  const [ads, setAds] = useState<SellerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedAd, setSelectedAd] = useState<SellerAd | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getAds();
      setAds(response.data as SellerAd[]);
      setError(null);
    } catch (err) {
      setError('Failed to load ads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAd = async (ad: SellerAd) => {
    try {
      await sellerService.toggleAd(ad.adNo, !ad.isActive);
      setAds(ads.map((a) => (a.adNo === ad.adNo ? { ...a, isActive: !a.isActive } : a)));
    } catch (err) {
      console.error('Failed to toggle ad:', err);
      setError('Failed to toggle ad status');
    }
  };

  const handleEditAd = (ad: SellerAd) => {
    setSelectedAd(ad);
    setShowDetailsModal(true);
  };

  const handleAdUpdated = () => {
    setShowDetailsModal(false);
    fetchAds();
  };

  const handleSyncAds = async () => {
    try {
      setSyncing(true);
      await sellerService.syncAdsFromBinance();
      fetchAds();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Failed to sync ads from Binance');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Your Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">{ads.length} ads available</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSyncAds}
            disabled={syncing}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Binance'}
          </button>
          <button
            onClick={fetchAds}
            className="h-10 px-4 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ads.length === 0 ? (
        <div className="surface-card rounded-2xl p-6 text-center text-muted-foreground">
          No ads found. Create ads on Binance to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <div key={ad.adNo} className={`surface-card rounded-2xl p-4 lg:p-5 space-y-4 ${ad.isActive ? '' : 'opacity-60'}`}>
              {/* Header */}
              <div className="pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base font-semibold">{ad.asset}/{ad.fiatUnit}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${ad.priceType === 1 ? 'bg-info/15 text-info' : 'bg-primary/15 text-primary'}`}>
                        {ad.priceType === 1 ? 'Fixed' : 'Floating'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">Ad #{ad.adNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{ad.fiatSymbol}{ad.price.toLocaleString()}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${ad.advStatus === 1 ? 'bg-success/15 text-success' : ad.advStatus === 3 ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {ad.advStatus === 1 ? '● Online' : ad.advStatus === 3 ? '● Offline' : '● Closed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Core Trading Info */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-surface-2 p-3 rounded-xl border border-border">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Min Order</p>
                    <p className="font-bold tabular-nums">{ad.fiatSymbol}{(ad.minOrder || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Order</p>
                    <p className="font-bold tabular-nums">{ad.fiatSymbol}{(ad.maxOrder || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
                    <p className="font-bold tabular-nums">{ad.asset} {(ad.surplusAmount || 0).toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Commission</p>
                    <p className="font-bold tabular-nums">{((ad.commissionRate || 0) * 100).toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
                    <p className="font-bold tabular-nums">{ad.payTimeLimit}m</p>
                  </div>
                </div>

                {/* Trade Methods */}
                {ad.tradeMethods && ad.tradeMethods.length > 0 && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-border">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">💳 Payment Methods</p>
                    <div className="flex flex-wrap gap-2">
                      {ad.tradeMethods.map((method) => (
                        <div key={String(method.payId)} className="flex items-center gap-2 bg-surface-3 px-2 py-1 rounded-lg text-xs">
                          {method.iconUrl && (
                            <img src={method.iconUrl} alt={String(method.tradeMethodName)} className="h-4 w-4" />
                          )}
                          <span className="text-foreground">{method.tradeMethodName}</span>
                          {method.commissionRate > 0 && (
                            <span className="text-primary text-xs">({(method.commissionRate * 100).toFixed(2)}%)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remarks Section */}
                {ad.remarks && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-border">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">📝 Terms & Remarks</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{ad.remarks}</p>
                  </div>
                )}

                {/* Eligibility Criteria */}
                {ad.rules?.eligibility && (
                  <div className="bg-surface-2 p-4 rounded-xl border border-border">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                      🎯 Eligibility Criteria
                    </p>

                    {/* CORE CRITERIA */}
                    <div className="mb-4">
                      <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Core Requirements</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Min 30-Day Trades</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.min30dayTrades === 'object'
                              ? (ad.rules.eligibility.min30dayTrades as any).value || 0
                              : ad.rules.eligibility.min30dayTrades || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Min Completion Rate</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.min30dayCompletionRate === 'object'
                              ? (ad.rules.eligibility.min30dayCompletionRate as any).value || 0
                              : ad.rules.eligibility.min30dayCompletionRate || 0}%
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Min Registered Days</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.minRegisteredDays === 'object'
                              ? (ad.rules.eligibility.minRegisteredDays as any).value || 0
                              : ad.rules.eligibility.minRegisteredDays || 0} days
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Min All Trades Count</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.minAllTradesCount === 'object'
                              ? (ad.rules.eligibility.minAllTradesCount as any).value || 0
                              : ad.rules.eligibility.minAllTradesCount || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Min Buy Orders</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.minBuyOrdersCount === 'object'
                              ? (ad.rules.eligibility.minBuyOrdersCount as any).value || 0
                              : ad.rules.eligibility.minBuyOrdersCount || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Min Sell Orders</span>
                          <p className="font-bold tabular-nums">
                            {typeof ad.rules.eligibility.minSellOrdersCount === 'object'
                              ? (ad.rules.eligibility.minSellOrdersCount as any).value || 0
                              : ad.rules.eligibility.minSellOrdersCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ADVANCED OPTIONS */}
                    {((typeof ad.rules.eligibility.minTradeVolume === 'object' && (ad.rules.eligibility.minTradeVolume as any).enabled) ||
                      (typeof ad.rules.eligibility.maxTradeVolume === 'object' && (ad.rules.eligibility.maxTradeVolume as any).enabled) ||
                      (typeof ad.rules.eligibility.minBtcHolding === 'object' && (ad.rules.eligibility.minBtcHolding as any).enabled)) && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-medium text-primary mb-2">Advanced Options</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {(typeof ad.rules.eligibility.minTradeVolume === 'object' && (ad.rules.eligibility.minTradeVolume as any).enabled) && (
                            <div>
                              <span className="text-xs text-muted-foreground">Min Trade Volume (USDT)</span>
                              <p className="font-bold tabular-nums">
                                {(ad.rules.eligibility.minTradeVolume as any).value || 0}
                              </p>
                            </div>
                          )}
                          {(typeof ad.rules.eligibility.maxTradeVolume === 'object' && (ad.rules.eligibility.maxTradeVolume as any).enabled) && (
                            <div>
                              <span className="text-xs text-muted-foreground">Max Trade Volume (USDT)</span>
                              <p className="font-bold tabular-nums">
                                {(ad.rules.eligibility.maxTradeVolume as any).value || 0}
                              </p>
                            </div>
                          )}
                          {(typeof ad.rules.eligibility.minBtcHolding === 'object' && (ad.rules.eligibility.minBtcHolding as any).enabled) && (
                            <div>
                              <span className="text-xs text-muted-foreground">Min BTC Holding</span>
                              <p className="font-bold tabular-nums">
                                {(ad.rules.eligibility.minBtcHolding as any).value || 0} BTC
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Methods */}
                <div className="bg-surface-2 p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    ✓ Verification Methods
                  </p>
                  <div className="space-y-2 text-sm">
                    {ad.rules?.methods?.method1?.enabled && (
                      <div className="flex items-center gap-2 p-2 bg-surface-3 rounded-lg border border-border">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success/15 text-success">✓</span>
                        <div className="flex-1">
                          <span className="font-medium">Liveness Check</span>
                          <p className="text-xs text-muted-foreground">Fastest verification</p>
                        </div>
                      </div>
                    )}
                    {ad.rules?.methods?.method2?.enabled && (
                      <div className="flex items-center gap-2 p-2 bg-surface-3 rounded-lg border border-border">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-info/15 text-info">✓</span>
                        <div className="flex-1">
                          <span className="font-medium">Documents + {ad.rules.methods.method2.mobileVerification ? 'Mobile OTP' : 'No OTP'}</span>
                          <p className="text-xs text-muted-foreground">Aadhaar & PAN verification</p>
                        </div>
                      </div>
                    )}
                    {ad.rules?.methods?.method3?.enabled && (
                      <div className="flex items-center gap-2 p-2 bg-surface-3 rounded-lg border border-border">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-primary/15 text-primary">✓</span>
                        <div className="flex-1">
                          <span className="font-medium">Full Verification ({ad.rules.methods.method3.paymentGateway})</span>
                          <p className="text-xs text-muted-foreground">Highest security level</p>
                        </div>
                      </div>
                    )}
                    {!ad.rules?.methods?.method1?.enabled &&
                      !ad.rules?.methods?.method2?.enabled &&
                      !ad.rules?.methods?.method3?.enabled && (
                        <div className="p-2 bg-destructive/15 border border-destructive/30 rounded-lg">
                          <span className="text-destructive font-medium">⚠️ No verification methods enabled!</span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleEditAd(ad)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Rules
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleToggleAd(ad)}
                    variant={ad.isActive ? 'destructive' : 'default'}
                    className="gap-2"
                  >
                    <Power className="h-4 w-4" />
                    {ad.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ad Details Modal */}
      {selectedAd && (
        <AdDetailsModal
          ad={selectedAd}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onUpdated={handleAdUpdated}
        />
      )}
    </div>
  );
}
