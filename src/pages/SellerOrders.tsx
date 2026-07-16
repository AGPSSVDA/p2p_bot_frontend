import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sellerService, SellerOrder, OrderStats } from '@/services/seller.service';
import { Skeleton } from '@/components/Skeletons';
import OrderDetailsModal from '@/components/seller/OrderDetailsModal';

const ORDER_STATES = [
  'ALL',
  'NEW_ORDER',
  'ELIGIBILITY_CHECK',
  'LIVENESS_VERIFICATION',
  'DOCUMENT_VERIFICATION',
  'MOBILE_OTP_VERIFICATION',
  'ORDER_VERIFICATION',
  'PAYMENT_WAITING',
  'PAYMENT_RECEIVED',
  'COMPLETED',
  'REJECTED',
];

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [selectedState, pagination]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getOrders({
        limit: pagination.limit,
        offset: pagination.offset,
        state: selectedState !== 'ALL' ? selectedState : undefined,
      });
      setOrders(response.data as SellerOrder[]);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await sellerService.getOrderStats();
      setStats(response.data as OrderStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleViewDetails = (order: SellerOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusColor = (state: string) => {
    if (state.includes('COMPLETED')) return 'default';
    if (state.includes('REJECTED')) return 'destructive';
    if (state.includes('PAYMENT')) return 'secondary';
    if (state.includes('VERIFICATION')) return 'outline';
    return 'secondary';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Orders</h1>
        <Button onClick={fetchOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eligible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eligibleOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(stats.totalFiatProcessed / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state === 'ALL' ? 'All States' : state.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders found</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Order No</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Buyer</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Ad</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Eligible</th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderNo} className="border-b border-border hover:bg-accent">
                        <td className="py-3 px-2 font-mono text-xs">{order.orderNo}</td>
                        <td className="py-3 px-2">{order.buyerNickname}</td>
                        <td className="py-3 px-2 font-mono text-xs">{order.adNo}</td>
                        <td className="py-3 px-2 tabular-nums">
                          ₹{order.fiatAmount} ({order.cryptoAmount} {order.asset})
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={getStatusColor(order.currentState)}>
                            {order.currentState.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={order.eligibilityCheckPassed ? 'default' : 'destructive'}
                          >
                            {order.eligibilityCheckPassed ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(order)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="md:hidden divide-y divide-border">
                {orders.map((order) => (
                  <div key={order.orderNo} className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground break-all">{order.orderNo}</span>
                      <Badge variant={getStatusColor(order.currentState)}>
                        {order.currentState.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{order.buyerNickname}</span>
                      <Badge variant={order.eligibilityCheckPassed ? 'default' : 'destructive'}>
                        {order.eligibilityCheckPassed ? 'Eligible' : 'Not eligible'}
                      </Badge>
                    </div>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      ₹{order.fiatAmount} ({order.cryptoAmount} {order.asset})
                    </p>
                    <p className="text-xs font-mono text-muted-foreground break-all">Ad #{order.adNo}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(order)}
                      className="gap-1 w-full"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
          disabled={pagination.offset === 0}
          variant="outline"
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Showing {pagination.offset + 1} to {pagination.offset + orders.length}
        </span>
        <Button
          onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
          disabled={orders.length < pagination.limit}
          variant="outline"
        >
          Next
        </Button>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          orderNo={selectedOrder.orderNo}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}
