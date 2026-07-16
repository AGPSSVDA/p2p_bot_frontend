import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/Skeletons';
import { sellerService, OrderDetail, OrderTimeline } from '@/services/seller.service';

interface OrderDetailsModalProps {
  orderNo: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({
  orderNo,
  isOpen,
  onClose,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<OrderTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, timelineRes] = await Promise.all([
          sellerService.getOrderDetail(orderNo),
          sellerService.getOrderTimeline(orderNo),
        ]);
        setOrder(orderRes.data);
        setTimeline(timelineRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderNo, isOpen]);

  const getStatusColor = (state: string) => {
    if (state.includes('COMPLETED')) return 'default';
    if (state.includes('REJECTED')) return 'destructive';
    if (state.includes('PAYMENT')) return 'secondary';
    if (state.includes('VERIFICATION')) return 'outline';
    return 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {orderNo}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-semibold font-mono">{order.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="mt-1" variant={getStatusColor(order.currentState)}>
                      {order.currentState.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buyer</p>
                    <p className="font-semibold">{order.buyerNickname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buyer KYC Name</p>
                    <p className="font-semibold">{order.buyerKycName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ad Number</p>
                    <p className="font-semibold font-mono">{order.adNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Eligible</p>
                    <Badge
                      className="mt-1"
                      variant={order.eligibilityCheckPassed ? 'default' : 'destructive'}
                    >
                      {order.eligibilityCheckPassed ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crypto & Fiat */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Crypto Amount</p>
                    <p className="font-semibold text-lg">
                      {order.crypto.amount} {order.crypto.asset}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fiat Amount</p>
                    <p className="font-semibold text-lg">
                      ₹{order.fiat.amount.toLocaleString()} {order.fiat.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Eligibility Check</span>
                  <Badge variant={order.eligibility.passed ? 'default' : 'destructive'}>
                    {order.eligibility.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Liveness</span>
                  <Badge variant={order.liveness.passed ? 'default' : 'secondary'}>
                    {order.liveness.passed ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Documents</span>
                  <Badge
                    variant={
                      order.documents.verifiedAt ? 'default' : 'secondary'
                    }
                  >
                    {order.documents.verifiedAt ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Mobile OTP</span>
                  <Badge
                    variant={
                      order.mobileOtp.verifiedAt ? 'default' : 'secondary'
                    }
                  >
                    {order.mobileOtp.verifiedAt ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Order Verification</span>
                  <Badge
                    variant={
                      order.orderVerification.verifiedAt ? 'default' : 'secondary'
                    }
                  >
                    {order.orderVerification.verifiedAt ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent rounded">
                  <span className="text-sm">Payment</span>
                  <Badge
                    variant={
                      order.payment.receivedAt ? 'default' : 'secondary'
                    }
                  >
                    {order.payment.receivedAt ? 'Received' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Documents the buyer uploaded in the Binance order chat (Method 2) */}
            {order.documents?.count > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Uploaded Documents ({order.documents.count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {order.documents.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded overflow-hidden hover:opacity-80 transition-opacity"
                        title="Open full image"
                      >
                        <img
                          src={doc.thumbnailUrl || doc.imageUrl}
                          alt={doc.type || 'Uploaded document'}
                          className="w-full h-32 object-cover bg-muted"
                          loading="lazy"
                        />
                        <div className="p-2 space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.type || 'Unclassified'}
                          </Badge>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.uploadedAt
                              ? new Date(doc.uploadedAt).toLocaleString()
                              : ''}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {timeline && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          {index !== timeline.timeline.length - 1 && (
                            <div className="w-0.5 h-12 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{event.event}</p>
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.detail && (
                            <p className="text-sm mt-1">{event.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            {order.messages && order.messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Messages ({order.messages.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.messages.map((msg, index) => (
                    <div key={index} className="p-3 bg-accent rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.messageType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* State History */}
            {order.stateHistory && order.stateHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>State History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">From</th>
                          <th className="text-left py-2 px-2">To</th>
                          <th className="text-left py-2 px-2">Reason</th>
                          <th className="text-left py-2 px-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.stateHistory.map((state, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-2 font-mono text-xs">
                              {state.from}
                            </td>
                            <td className="py-2 px-2 font-mono text-xs">
                              {state.to}
                            </td>
                            <td className="py-2 px-2">{state.reason || '-'}</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground">
                              {new Date(state.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
