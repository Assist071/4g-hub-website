import { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export function KitchenDashboard() {
  const { orders, updateOrderStatus } = useOrderStore();
  
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
  };

  const OrderCard = ({ order, actions }: { order: Order; actions: React.ReactNode }) => (
    <div className="tech-card corner-bracket edge-pulse">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-primary neon-glow">Order #{order.orderNumber}</CardTitle>
          <div className="text-sm text-muted-foreground font-semibold">
            {order.createdAt.toLocaleTimeString()}
          </div>
        </div>
        {order.customerName && (
          <p className="text-sm text-muted-foreground">Customer: {order.customerName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-foreground">{item.quantity}x {item.menuItem.name}</div>
                {item.customizations.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Custom: {item.customizations.map(c => {
                      try {
                        return typeof c === 'string' && c.startsWith('{') ? JSON.parse(c).name : c;
                      } catch (e) {
                        return c;
                      }
                    }).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-sm text-accent-foreground bg-accent/20 border border-accent/30 p-2 rounded mt-1">
                    Note: {item.notes}
                  </div>
                )}
              </div>
              <div className="text-sm font-bold text-primary neon-glow ml-2">
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
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-2 border-t border-primary/20">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-primary neon-glow">Total: ₱{order.total.toFixed(2)}</span>
            <Badge className="neon-glow-primary">{order.terminal}</Badge>
          </div>
          {actions}
        </div>
      </CardContent>
    </div>
  );

  return (
    <div className="p-6 bg-background min-h-screen grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4 relative z-10">
      <div className="mb-8">
        <h1 className="text-4xl md:text-2xl font-bold  neon-glow cyber-text flex items-center gap-3 mb-2">
          <ChefHat className="h-10 w-10" />
          Kitchen Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Manage and track all incoming orders in real-time</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 relative z-10">
        {/* Pending Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/30">
            <Clock className="h-6 w-6 text-warning neon-glow" />
            <h2 className="text-2xl font-bold text-foreground cyber-text">Pending ({pendingOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="tech-card corner-bracket p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actions={
                    <Button 
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="w-full font-bold neon-glow-primary hover:shadow-lg transition-all"
                    >
                      Start Preparing
                    </Button>
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Preparing Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/30">
            <ChefHat className="h-6 w-6 text-primary neon-glow" />
            <h2 className="text-2xl font-bold text-foreground cyber-text">Preparing ({preparingOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="tech-card corner-bracket p-8 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">No orders in preparation</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actions={
                    <Button 
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      className="w-full font-bold neon-glow-primary hover:shadow-lg transition-all"
                    >
                      Mark Ready
                    </Button>
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Ready Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/30">
            <CheckCircle className="h-6 w-6 text-success neon-glow" />
            <h2 className="text-2xl font-bold text-foreground cyber-text">Ready ({readyOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="tech-card corner-bracket p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">No orders ready</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actions={
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        className="w-full font-bold neon-glow-primary hover:shadow-lg transition-all"
                      >
                        Complete Order
                      </Button>
                      <Button 
                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                        className="w-full font-bold border-2 border-primary/50 hover:border-primary hover:bg-primary/5 transition-all"
                        variant="outline"
                        size="sm"
                      >
                        Back to Preparing
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}