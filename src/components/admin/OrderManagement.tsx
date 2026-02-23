import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, ClipboardList } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function OrderManagement() {
  const { orders, updateOrderStatus, deleteOrder } = useOrderStore();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    toast({
      title: "Success",
      description: `Order status updated to ${newStatus}`
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrder(orderId);
    toast({
      title: "Success",
      description: "Order deleted successfully"
    });
  };

  const handleBulkDelete = () => {
    Array.from(selectedOrders).forEach(orderId => {
      deleteOrder(orderId);
    });
    setSelectedOrders(new Set());
    toast({
      title: "Success",
      description: `${selectedOrders.size} order(s) deleted successfully`
    });
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'preparing': return 'outline';
      case 'ready': return 'secondary';
      case 'completed': return 'default';
      default: return 'outline';
    }
  };

  const formatDate = (date: Date) => {
    // Add 8 hours to convert from UTC to Philippine Time (UTC+8)
    const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(phTime);
  };

  return (
    <div className="relative space-y-6">
      {/* Background gradient effects */}
      <div className="absolute -inset-10 bg-primary/5 blur-3xl rounded-full -z-10" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold cyber-text neon-glow flex items-center gap-3">
            Order Details
            </h2>
            {selectedOrders.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {selectedOrders.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 neon-glow-primary font-bold"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedOrders.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Multiple Orders</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedOrders.size} selected order(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 tech-card corner-bracket">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="tech-card corner-bracket edge-pulse overflow-hidden relative">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        </div>
        <CardContent className="relative z-10 pt-6">
        <div className="override-scroll">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-primary/20 hover:bg-primary/5">
                <TableHead className="w-12 bg-primary/5">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-primary neon-glow">Order #</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Customer</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Items</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Total</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Status</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Date</TableHead>
                <TableHead className="font-bold text-primary neon-glow">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, index) => (
                <TableRow 
                  key={order.id} 
                  className={`border-b border-primary/10 hover:bg-primary/5 transition-colors ${
                    index % 2 === 0 ? 'bg-accent/2' : ''
                  }`}
                >
                  <TableCell className="bg-primary/5">
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-bold text-primary">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName || 'Walk-in'}</p>
                      <p className="text-xs text-muted-foreground">{order.terminal}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="tech-card bg-accent/50">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">₱{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus as Order['status'])}
                    >
                      <SelectTrigger className="w-32 tech-card">
                        <Badge 
                          variant={getStatusBadgeVariant(order.status)}
                          className="neon-glow-primary"
                        >
                          {order.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="gap-1 tech-card hover:neon-glow-primary transition-all"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="tech-card">
                          <DialogHeader>
                            <DialogTitle className="neon-glow">Order #{selectedOrder?.orderNumber} Details</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-primary/5 tech-card">
                                  <h4 className="font-medium text-sm text-primary neon-glow">Customer</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedOrder.customerName || 'Walk-in'}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-accent/5 tech-card">
                                  <h4 className="font-medium text-sm text-primary neon-glow">Terminal</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedOrder.terminal}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-primary/5 tech-card">
                                  <h4 className="font-medium text-sm text-primary neon-glow">Status</h4>
                                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="mt-1">
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                                <div className="p-3 rounded-lg bg-accent/5 tech-card">
                                  <h4 className="font-medium text-sm text-primary neon-glow">Total</h4>
                                  <p className="text-sm font-bold text-primary">₱{selectedOrder.total.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <div className="p-4 rounded-lg bg-muted/30 tech-card">
                                <h4 className="font-bold mb-3 text-primary neon-glow">Order Items</h4>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex justify-between p-3 bg-card rounded tech-card border border-primary/10 hover:bg-primary/5 transition-colors">
                                      <div>
                                        <p className="font-medium">{item.menuItem.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Qty: {item.quantity}
                                        </p>
                                        {item.customizations && item.customizations.length > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            {item.customizations.join(', ')}
                                          </p>
                                        )}
                                        {item.notes && (
                                          <p className="text-xs text-muted-foreground">
                                            Note: {item.notes}
                                          </p>
                                        )}
                                      </div>
                                      <p className="font-bold text-primary">
                                        ₱{(item.menuItem.price * item.quantity).toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive tech-card transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="tech-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="neon-glow">Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete order #{order.orderNumber}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <div className="p-4 rounded-lg bg-muted/50 w-fit mx-auto mb-4 tech-card corner-bracket">
              <ClipboardList className="h-12 w-12 opacity-50 text-primary/50" />
            </div>
            <p className="font-semibold text-lg">No orders found</p>
            <p className="text-sm text-muted-foreground">Orders will appear here when created</p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}