import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Utensils, 
  Monitor, 
  ChefHat, 
  TrendingUp, 
  Clock, 
  Users,
  Wifi,
  ArrowRight
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

const Index = () => {
  const { orders, getPendingOrders } = useOrderStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  const pendingOrders = getPendingOrders();
  const completedToday = orders.filter(order => 
    order.status === 'completed' && 
    order.createdAt.toDateString() === new Date().toDateString()
  ).length;
  
  const revenueToday = orders
    .filter(o => o.createdAt.toDateString() === new Date().toDateString())
    .reduce((sum, order) => sum + order.total, 0);

  const quickActions = [
    {
      title: 'Take Orders',
      description: 'Browse menu and place new orders',
      icon: Utensils,
      to: '/menu',
      color: 'bg-primary text-primary-foreground',
      badge: null
    },
    {
      title: 'Queue Display',
      description: 'Monitor order status and queue',
      icon: Monitor,
      to: '/queue',
      color: 'bg-secondary text-secondary-foreground',
      badge: pendingOrders.length > 0 ? pendingOrders.length : null
    },
    {
      title: 'Kitchen Dashboard',
      description: 'Manage order preparation',
      icon: ChefHat,
      to: '/kitchen',
      color: 'bg-accent text-accent-foreground',
      badge: orders.filter(o => o.status === 'preparing').length > 0 ? 
        orders.filter(o => o.status === 'preparing').length : null
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      <div className="container mx-auto px-4 py-6 relative z-10"> 
        {/* Dashboard Title */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-4xl md:text-2xl font-bold neon-glow cyber-text mb-3">
            Dashboard
          </h1>
        </div>
        {/* Stats Overview */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-4 mb-12 md:mb-16">
          <div className="tech-card corner-bracket edge-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5 px-6">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-5 w-5 text-warning neon-glow" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-bold text-warning neon-glow">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground font-semibold mt-2">In queue</p>
            </CardContent>
          </div>
          
          <div className="tech-card corner-bracket edge-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5 px-6">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <Users className="h-5 w-5 text-primary neon-glow" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-bold text-primary neon-glow">{orders.length}</div>
              <p className="text-xs text-muted-foreground font-semibold mt-2">Total orders</p>
            </CardContent>
          </div>
          
          <div className="tech-card corner-bracket edge-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5 px-6">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-5 w-5 text-success neon-glow" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-bold text-success neon-glow">{completedToday}</div>
              <p className="text-xs text-muted-foreground font-semibold mt-2">Finished today</p>
            </CardContent>
          </div>
          
          <div className="tech-card corner-bracket edge-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5 px-6">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary neon-glow" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-bold text-primary neon-glow">₱{revenueToday.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground font-semibold mt-2">Today's total</p>
            </CardContent>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-3 mb-12 md:mb-16">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.to} className="tech-card corner-bracket edge-pulse relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pt-6 px-6 pb-0">
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`p-3 rounded-lg ${action.color} border-2 border-primary/50 neon-glow-primary`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {action.badge && (
                      <Badge className="absolute top-6 right-6 neon-glow-primary font-bold">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl text-foreground cyber-text font-bold mt-6 mb-0">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 pt-4 px-6 pb-6">
                  <p className="text-muted-foreground mb-6 font-medium">{action.description}</p>
                  <Button asChild className="w-full gap-2 font-bold neon-glow-primary border-2 border-primary/50 hover:shadow-lg transition-all">
                    <Link to={action.to}>
                      Open <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </div>
            );
          })}
        </div>

        {/* System Information */}
        <div className="tech-card corner-bracket edge-pulse">
          <CardHeader className="pt-6 px-6 pb-0">
            <CardTitle className="text-primary neon-glow cyber-text">System Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="grid gap-8 md:gap-12 md:grid-cols-2">
              <div className="space-y-4 border-l-2 border-primary/30 pl-6">
                <h4 className="font-bold text-foreground text-lg">Local Network Features</h4>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-3"><span className="text-primary neon-glow">✅</span> Real-time order synchronization</li>
                  <li className="flex items-center gap-3"><span className="text-primary neon-glow">✅</span> Multi-terminal support</li>
                  <li className="flex items-center gap-3"><span className="text-primary neon-glow">✅</span> Kitchen display integration</li>
                </ul>
              </div>
              <div className="space-y-4 border-l-2 border-primary/30 pl-6">
                <h4 className="font-bold text-foreground text-lg">Quick Stats</h4>
                <div className="text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">System uptime:</span>
                    <span className="font-bold text-primary neon-glow">Running</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current time:</span>
                    <span className="font-bold text-primary neon-glow">
                      {currentTime.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active terminals:</span>
                    <span className="font-bold text-primary neon-glow">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default Index;
