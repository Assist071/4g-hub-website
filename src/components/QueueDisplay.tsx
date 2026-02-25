import { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Coffee } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useEffect } from 'react';

const statusConfig = {
  pending: {
    label: 'Order Received',
    icon: Clock,
    color: 'bg-warning text-warning-foreground',
    description: 'Your order has been received and is in queue'
  },
  preparing: {
    label: 'Preparing',
    icon: Coffee,
    color: 'bg-preparing text-white',
    description: 'Your order is being prepared'
  },
  ready: {
    label: 'Ready for Pickup',
    icon: CheckCircle,
    color: 'bg-ready text-success-foreground',
    description: 'Your order is ready! Please collect it'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-completed text-white',
    description: 'Order completed'
  }
};

export function QueueDisplay() {
  const { getPendingOrders, loadOrdersFromDatabase } = useOrderStore();
  
    useEffect(() => {
      loadOrdersFromDatabase();
      // Refresh every 5 seconds
      const interval = setInterval(loadOrdersFromDatabase, 5000);
      return () => clearInterval(interval);
    }, []);

  const pendingOrders = getPendingOrders();

  const getEstimatedTime = (order: Order, index: number) => {
    const baseTime = 10; // 10 minutes base
    const additionalTime = index * 5; // 5 minutes per order ahead
    return baseTime + additionalTime;
  };

  if (pendingOrders.length === 0) {
    return (
      <div className="tech-card corner-bracket edge-pulse h-full">
        <CardHeader className="pb-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-center text-primary neon-glow cyber-text">
            <CheckCircle className="h-6 w-6 text-success" />
            Order Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="text-center text-muted-foreground py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
            <p className="font-bold text-lg mb-2">All caught up!</p>
            <p className="text-sm">No pending orders in the queue</p>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="tech-card corner-bracket edge-pulse h-full">
      <CardHeader className="pb-6 pt-6">
        <CardTitle className="flex items-center gap-2 text-primary neon-glow cyber-text">
          <AlertCircle className="h-6 w-6" />
          Order Queue ({pendingOrders.length} orders)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-5 max-h-96 overflow-y-auto">
          {pendingOrders.map((order, index) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            const estimatedTime = getEstimatedTime(order, index);
            
            return (
              <div key={order.id} className="border-2 border-primary/30 rounded-lg p-5 bg-card/50 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary neon-glow">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <Badge className="neon-glow-primary border-primary/50">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {order.customerName && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {order.customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary neon-glow">₱{order.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground font-semibold mt-1">
                      ~{estimatedTime} min
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 relative z-10">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                        {item.customizations.length > 0 && (
                          <span className="text-muted-foreground ml-2">
                            ({item.customizations.map(c => {
                              try {
                                return typeof c === 'string' && c.startsWith('{') ? JSON.parse(c).name : c;
                              } catch (e) {
                                return c;
                              }
                            }).join(', ')})
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-primary neon-glow">
                        ₱{(() => {
                          const basePrice = item.menuItem.price * item.quantity;
                          const customizationPrice = item.customizations.reduce((total, custom) => {
                            try {
                              if (typeof custom === 'string' && custom.startsWith('{')) {
                                const parsed = JSON.parse(custom);
                                return total + (parsed.price || 0);
                              }
                            } catch (e) {
                              // If parsing fails, skip
                            }
                            return total;
                          }, 0);
                          return (basePrice + (customizationPrice * item.quantity)).toFixed(2);
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-primary/20 relative z-10">
                  <p className="text-xs text-muted-foreground font-medium">{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
}