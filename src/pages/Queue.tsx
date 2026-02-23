import { QueueDisplay } from '@/components/QueueDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, Users } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function Queue() {
  const { orders, getPendingOrders } = useOrderStore();
  
  const pendingOrders = getPendingOrders();
  const completedToday = orders.filter(order => 
    order.status === 'completed' && 
    order.createdAt.toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Queue */}
          <div className="lg:col-span-1">
            <QueueDisplay />
          </div>

          {/* Queue Statistics */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Queue Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {orders.filter(o => o.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-preparing">
                      {orders.filter(o => o.status === 'preparing').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Preparing</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-ready">
                      {orders.filter(o => o.status === 'ready').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Ready</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-completed">
                      {completedToday}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed Today</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Today's Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span className="font-medium">{orders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue Today:</span>
                      <span className="font-medium text-primary">
                        ₱{orders
                          .filter(o => o.createdAt.toDateString() === new Date().toDateString())
                          .reduce((sum, order) => sum + order.total, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Order Value:</span>
                      <span className="font-medium">
                        ₱{orders.length > 0 
                          ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Queue updates in real-time • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}