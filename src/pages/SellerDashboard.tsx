import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, Users, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sellerService, DashboardOverview, HealthMetrics } from '@/services/seller.service';
import { Skeleton } from '@/components/Skeletons';

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  // Seller bot on/off (persisted in DB, survives restart)
  const [botRunning, setBotRunning] = useState<boolean | null>(null);
  const [botToggling, setBotToggling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, healthRes] = await Promise.all([
          sellerService.getDashboard(),
          sellerService.getHealthMetrics(),
        ]);
        setDashboard(dashboardRes.data as DashboardOverview);
        setHealth(healthRes.data as HealthMetrics);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Load bot status separately so a failure here doesn't break the dashboard.
    sellerService.getBotStatus()
      .then((r) => setBotRunning(!!r.running))
      .catch(() => setBotRunning(null));
  }, []);

  const handleToggleBot = async () => {
    if (botRunning === null) return;
    try {
      setBotToggling(true);
      const res = botRunning
        ? await sellerService.stopBot()
        : await sellerService.startBot();
      setBotRunning(!!res.running);
    } catch (err) {
      console.error('Failed to toggle bot:', err);
      setError('Failed to toggle seller bot');
    } finally {
      setBotToggling(false);
    }
  };

  const handleSyncAds = async () => {
    try {
      setSyncing(true);
      await sellerService.syncAdsFromBinance();
      // Refresh dashboard data after sync
      const [dashboardRes, healthRes] = await Promise.all([
        sellerService.getDashboard(),
        sellerService.getHealthMetrics(),
      ]);
      setDashboard(dashboardRes.data as DashboardOverview);
      setHealth(healthRes.data as HealthMetrics);
    } catch (err) {
      console.error('Sync failed:', err);
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboard || !health) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Seller Dashboard</h1>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Seller bot on/off toggle */}
          {botRunning !== null && (
            <Button
              onClick={handleToggleBot}
              disabled={botToggling}
              variant={botRunning ? 'destructive' : 'default'}
              size="sm"
              className="gap-2"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  botRunning ? 'bg-white animate-pulse' : 'bg-white/70'
                }`}
              />
              {botToggling
                ? 'Please wait…'
                : botRunning
                ? 'Stop Bot'
                : 'Start Bot'}
            </Button>
          )}
          <Button
            onClick={handleSyncAds}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Ads'}
          </Button>
          <Badge variant={health.score >= 80 ? 'default' : 'secondary'}>
            Health: {health.score}/100
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ads Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.summary.ads.active}</div>
            <p className="text-xs text-muted-foreground">of {dashboard.summary.ads.total} total</p>
          </CardContent>
        </Card>

        {/* Orders Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.summary.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.summary.orders.completed} completed
            </p>
          </CardContent>
        </Card>

        {/* Volume */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiat Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dashboard.summary.volume.fiat.total / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">{dashboard.summary.volume.fiat.currency}</p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.health.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Order completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Liveness Completed</span>
                <Badge variant="outline">{dashboard.verification.liveness.completed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Documents Verified</span>
                <Badge variant="outline">{dashboard.verification.documents.verified}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">OTP Verified</span>
                <Badge variant="outline">{dashboard.verification.otp.verified}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Orders Verified</span>
                <Badge variant="outline">{dashboard.verification.orderVerification.completed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payments Received</span>
                <Badge variant="outline">{dashboard.verification.payment.received}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completion Rate</span>
                <Badge variant={health.completionRate >= 80 ? 'default' : 'secondary'}>
                  {health.completionRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Eligibility Pass Rate</span>
                <Badge variant={health.eligibilityPassRate >= 90 ? 'default' : 'secondary'}>
                  {health.eligibilityPassRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rejection Rate</span>
                <Badge variant={health.rejectionRate <= 10 ? 'default' : 'secondary'}>
                  {health.rejectionRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Liveness Time</span>
                <Badge variant="outline">{health.avgLivenessTimeMinutes}m</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Document Verify</span>
                <Badge variant="outline">{health.avgDocumentVerifyTimeMinutes}m</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboard.orders.byState).map(([state, count]) => (
              <div key={state} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground capitalize">{state.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Order No</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Buyer</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Eligible</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.orders.recent.map((order) => (
                  <tr key={order.orderNo} className="border-b border-border hover:bg-accent">
                    <td className="py-2 px-2 font-mono text-xs">{order.orderNo}</td>
                    <td className="py-2 px-2">{order.buyerNickname}</td>
                    <td className="py-2 px-2 tabular-nums">
                      ₹{order.fiatAmount} ({order.cryptoAmount} {order.asset})
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant="outline">{order.state}</Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={order.eligible ? 'default' : 'destructive'}>
                        {order.eligible ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden divide-y divide-border">
            {dashboard.orders.recent.map((order) => (
              <div key={order.orderNo} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground break-all">{order.orderNo}</span>
                  <Badge variant={order.eligible ? 'default' : 'destructive'}>
                    {order.eligible ? 'Eligible' : 'Not eligible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{order.buyerNickname}</span>
                  <Badge variant="outline">{order.state}</Badge>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">
                  ₹{order.fiatAmount} ({order.cryptoAmount} {order.asset})
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Ads */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.ads.topPerforming.map((ad) => (
              <div key={ad.adNo} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{ad.adNo}</p>
                  <p className="text-xs text-muted-foreground">
                    {ad.completedCount} / {ad.orderCount} completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{ad.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">₹{ad.totalVolume.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
