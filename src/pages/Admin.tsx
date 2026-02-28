  import { useMemo, useState, useEffect } from 'react';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { BarChart3, Users, Database, Download, Upload, Package, ClipboardList, LogOut, ShieldCheck, TrendingUp, Trophy, Wand2, AlertCircle, Clock , Activity, Plus, Trash2, Eye, EyeOff, Loader, Server } from 'lucide-react';
  import { useOrderStore } from '@/store/orderStore';
  import { useAuthStore } from '@/store/authStore';
  import { AdminMenuManagement } from '@/components/AdminMenuManagement';
  import { MenuInventory } from '@/components/MenuInventory';
  import { useMenuData } from '@/hooks/useMenuData';
  import { useStaffDatabase } from '@/hooks/useStaffDatabase';
  import MenuManagement from '@/components/admin/MenuManagement';
  import OrderManagement from '@/components/admin/OrderManagement';
  import { PCManagementAdmin } from '@/components/PCManagementAdmin';

  
  // ✅ Added: Import charts from Recharts
  import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Tooltip,  
    Legend,
    XAxis,    
    YAxis,
    Area,
    ResponsiveContainer,
  } from 'recharts';

  // Custom Tooltip Component for Futuristic Design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg p-3 bg-gradient-to-r from-slate-900/95 to-slate-800/95 border border-purple-500/30 shadow-2xl backdrop-blur-sm">
          <p className="text-xs text-cyan-300 font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-sm font-medium text-white">
                {entry.name}: <span className="text-purple-300">₱{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  export default function Admin() {
    const { orders } = useOrderStore();
    const { logout } = useAuthStore();
    const { menuItems, loading } = useMenuData();
    const { loadStaffUsers, addStaffUser, deleteStaffUser, loading: staffLoading } = useStaffDatabase();
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [users, setUsers] = useState<Array<{ id: string; email: string; role: string; password: string }>>([]);
    const [newUser, setNewUser] = useState({ email: '', role: 'staff', password: '' });
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

    useEffect(() => {
      // Load users from Supabase
      const loadUsers = async () => {
        const staffUsers = await loadStaffUsers();
        setUsers(staffUsers);
      };
      loadUsers();
    }, [loadStaffUsers]);

    const addUser = async () => {
      if (!newUser.email || !newUser.password) {
        alert('Please fill in all fields');
        return;
      }
      const result = await addStaffUser({
        email: newUser.email,
        role: newUser.role as any,
        password: newUser.password,
      });
      if (result) {
        setUsers([...users, result]);
        setNewUser({ email: '', role: 'staff', password: '' });
      } else {
        alert('Failed to add user. Please try again.');
      }
    };

    const deleteUser = async (id: string) => {
      const success = await deleteStaffUser(id);
      if (success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert('Failed to delete user. Please try again.');
      }
    };

    useEffect(() => {
      // Add error handler for runtime errors
      const handleError = (event: ErrorEvent) => {
        console.error('Render error:', event.error);
        setRenderError(event.error?.message || 'An error occurred');
      };
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // ✅ Data Processing Functions (moved above early returns to keep hooks stable)
    const revenueData = useMemo(() => {
      if (orders.length === 0) return [];
      const grouped: Record<string, number> = {};
      orders.forEach((order) => {
        try {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          const date = orderDate.toLocaleDateString();
          grouped[date] = (grouped[date] || 0) + order.total;
        } catch (e) {
          console.warn('Error processing order date:', e);
        }
      });
      const data = Object.entries(grouped).map(([date, total]) => ({ 
        date, 
        total: parseFloat(total.toFixed(2)) 
      }));
      return data.length > 0 ? data : [];
    }, [orders]);

    // Time range selection for revenue chart (7d / 30d / 90d)
    const [revenueRange, setRevenueRange] = useState<'7d' | '30d' | '90d'>('7d');

    const revenueChartData = useMemo(() => {
      if (!revenueData || revenueData.length === 0) return [];
      const count = revenueRange === '7d' ? 7 : revenueRange === '30d' ? 30 : 90;
      return revenueData.slice(-count);
    }, [revenueData, revenueRange]);

    const statusData = useMemo(() => {
      if (orders.length === 0) return [];
      const grouped: Record<string, number> = {};
      orders.forEach((order) => {
        grouped[order.status] = (grouped[order.status] || 0) + 1;
      });
      return Object.entries(grouped).map(([status, count]) => ({ status, count }));
    }, [orders]);

    const topItemsData = useMemo(() => {
      if (orders.length === 0) return [];
      const itemSales: Record<string, number> = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
        });
      });
      const sorted = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      return sorted.map(([name, quantity]) => ({ name, quantity }));
    }, [orders]);

    // ✅ PREDICTIVE ANALYTICS
    const predictiveData = useMemo(() => {
      try {
        // Average Daily Revenue
        const dailyRevenue: Record<string, number> = {};
        orders.forEach((order) => {
          try {
            const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            const date = orderDate.toLocaleDateString();
            dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total || 0);
          } catch (e) {
            console.warn('Error processing order date:', e);
          }
        });
        const revenues = Object.values(dailyRevenue);
        const avgDailyRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;

        // Peak Hours Analysis
        const hourlyOrders: Record<number, number> = {};
        orders.forEach((order) => {
          try {
            const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            const hour = orderDate.getHours();
            hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
          } catch (e) {
            console.warn('Error processing hour:', e);
          }
        });
        const peakHours = Object.entries(hourlyOrders)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour, count]) => ({ hour: `${hour}:00`, orders: count }));

        // Predicted 7-day revenue
        const predictedRevenue = (avgDailyRevenue * 5).toFixed(2);

        // Growth rate
        const recentOrders = orders.slice(Math.max(0, orders.length - 10));
        const olderOrders = orders.slice(Math.max(0, orders.length - 20), Math.max(0, orders.length - 10));
        const recentAvg = recentOrders.length > 0 ? recentOrders.reduce((sum, o) => sum + (o.total || 0), 0) / recentOrders.length : 0;
        const olderAvg = olderOrders.length > 0 ? olderOrders.reduce((sum, o) => sum + (o.total || 0), 0) / olderOrders.length : 0;
        const growthRate = olderAvg > 0 ? (((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1) : 0;

        // High demand items for restocking
        const itemDemand: Record<string, { quantity: number; lastOrdered: Date }> = {};
        orders.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (item?.name) {
                const itemName = String(item.name);
                if (!itemDemand[itemName]) {
                  itemDemand[itemName] = { quantity: 0, lastOrdered: new Date(0) };
                }
                itemDemand[itemName].quantity += item.quantity || 0;
                try {
                  const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
                  if (orderDate > itemDemand[itemName].lastOrdered) {
                    itemDemand[itemName].lastOrdered = orderDate;
                  }
                } catch (e) {
                  console.warn('Error processing item date:', e);
                }
              }
            });
          }
        });

        return {
          avgDailyRevenue: avgDailyRevenue.toFixed(2),
          predictedRevenue: String(predictedRevenue),
          peakHours: Array.isArray(peakHours) ? peakHours : [],
          growthRate: String(growthRate),
          itemDemand: itemDemand || {},
        };
      } catch (error) {
        console.error('Error calculating predictive data:', error);
        return {
          avgDailyRevenue: '0.00',
          predictedRevenue: '0.00',
          peakHours: [],
          growthRate: '0',
          itemDemand: {},
        };
      }
    }, [orders]);

    // Show error if rendering failed
    if (renderError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-destructive/10">
              <CardTitle className="text-destructive">Render Error</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm mb-4">{renderError}</p>
              <p className="text-xs text-muted-foreground mb-4">Check the browser console for more details.</p>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const exportData = () => {
      const data = {
        orders,
        exportDate: new Date().toISOString(),
        summary: {
          totalOrders: orders.length,
          totalRevenue,
          avgOrderValue,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0']; // ✅ Chart colors

    return (
      <div className="min-h-screen bg-background grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 relative z-10">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl md:text-2xl font-bold neon-glow cyber-text">Admin Dashboard</h1>
              <Button onClick={logout} variant="outline" className="gap-2 font-bold border-2 border-primary/50 hover:border-primary hover:bg-primary/5 transition-all">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
            <TabsList className="grid w-full grid-cols-5 tech-border">
              <TabsTrigger value="overview" className="gap-2 font-semibold hover:text-primary transition-colors">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-2 font-semibold hover:text-primary transition-colors">
                <Package className="h-4 w-4" />
                Menu Management
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 font-semibold hover:text-primary transition-colors">
                <ClipboardList className="h-4 w-4" />
                Order Management
              </TabsTrigger>
              <TabsTrigger value="menu-inventory" className="gap-2 font-semibold hover:text-primary transition-colors">
                <Package className="h-4 w-4" />
                Stock Levels
              </TabsTrigger>
              <TabsTrigger value="pc-management" className="gap-2 font-semibold hover:text-primary transition-colors">
                <Server className="h-4 w-4" />
                PC Management
              </TabsTrigger>
            </TabsList>

            {/* === OVERVIEW TAB === */}
            <TabsContent value="overview" className="space-y-6">
              {/* Analytics Overview */}
              <div className="tech-card corner-bracket">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary neon-glow">
                    <BarChart3 className="h-5 w-5" />
                    Sales Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg hover:border-primary/40 transition-all duration-300">
                      <div className="text-3xl font-bold text-primary neon-glow">{orders.length}</div>
                      <div className="text-sm text-muted-foreground mt-2 font-semibold">Total Orders</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-success/5 to-primary/5 border border-primary/20 rounded-lg hover:border-primary/40 transition-all duration-300">
                      <div className="text-3xl font-bold text-primary neon-glow">₱{totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-2 font-semibold">Total Revenue</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-accent/5 to-primary/5 border border-primary/20 rounded-lg hover:border-primary/40 transition-all duration-300">
                      <div className="text-3xl font-bold text-primary neon-glow">₱{avgOrderValue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-2 font-semibold">Avg Order Value</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-success/5 border border-primary/20 rounded-lg hover:border-primary/40 transition-all duration-300">
                      <div className="text-3xl font-bold text-primary neon-glow">
                        {orders.filter((o) => o.status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-semibold">Completed Orders</div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* ✅ NEW CHARTS SECTION */}
                {/* Revenue Trend - Full Width */}
                <div className="tech-card corner-bracket edge-pulse">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-primary neon-glow">
                       <span>Revenue Trends</span>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground mr-2">Range</div>
                        <div className="inline-flex rounded-md bg-muted p-1 border border-primary/20">
                          <button
                            onClick={() => setRevenueRange('7d')}
                            className={`px-2 py-1 text-xs rounded font-semibold transition-all ${revenueRange === '7d' ? 'bg-primary text-primary-foreground neon-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            7d
                          </button>
                          <button
                            onClick={() => setRevenueRange('30d')}
                            className={`px-2 py-1 text-xs rounded font-semibold transition-all ${revenueRange === '30d' ? 'bg-primary text-primary-foreground neon-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            30d
                          </button>
                          <button
                            onClick={() => setRevenueRange('90d')}
                            className={`px-2 py-1 text-xs rounded font-semibold transition-all ${revenueRange === '90d' ? 'bg-primary text-primary-foreground neon-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            90d
                          </button>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#7C3AED' }} />
                        Revenue
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#06B6D4' }} />
                        Predicted
                      </span>
                    </div>



                    <div className="rounded-lg p-3 bg-gradient-to-b from-white/5 to-white/3 backdrop-blur-sm border border-white/6">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={revenueChartData || []} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7C3AED', strokeWidth: 2, opacity: 0.5 }} />
                          <Line 
                            type="linear" 
                            dataKey="total" 
                            stroke="#7C3AED" 
                            strokeWidth={3} 
                            dot={{ fill: '#7C3AED', r: 4 }}
                            activeDot={{ r: 7, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                            isAnimationActive={false}
                          />
                          <Area type="linear" dataKey="total" stroke="none" fill="url(#gradRevenue)" isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </div>

                {/* Status Distribution & Top Items - Side by Side */}
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Order Status Distribution - Futuristic Donut */}
                  <div className="tech-card corner-bracket edge-pulse">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-primary neon-glow">
                      <span>Order Status Distribution</span>
                      <Badge className="neon-glow-primary">Realtime</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-40 h-40 relative">
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <defs>
                              <linearGradient id="donutGlow" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.9} />
                              </linearGradient>
                            </defs>
                            <Pie
                              data={statusData || []}
                              dataKey="count"
                              nameKey="status"
                              innerRadius={42}
                              outerRadius={70}
                              paddingAngle={4}
                            >
                              {(statusData || []).map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Center overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
                            {orders.length}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="space-y-2">
                          {(statusData || []).map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                <div>
                                  <div className="font-medium text-sm">{s.status}</div>
                                  <div className="text-xs text-muted-foreground">{s.count} orders</div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-foreground">{Math.round((s.count / Math.max(1, orders.length)) * 100)}%</div>
                            </div>
                          ))}
                          {(!statusData || statusData.length === 0) && (
                            <div className="text-sm text-muted-foreground">No data yet</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Top-Selling Items - Futuristic Bars */}
                <div className="tech-card corner-bracket edge-pulse">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-primary neon-glow">
                      <span>Top-Selling Items</span>
                      <Badge className="neon-glow-primary">Top 5</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg p-3 bg-gradient-to-b from-white/5 to-white/3 backdrop-blur-sm border border-white/6">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={topItemsData || []} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                            </linearGradient>
                          </defs>
                          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }} />
                          <Bar dataKey="quantity" fill="url(#barGrad)" radius={[8, 8, 8, 8]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </div>
              </div>

              {/* ✅ PREDICTIVE DATA ANALYTICS */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 neon-glow cyber-text">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Predictive Analytics & Insights
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Average Daily Revenue */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-3">Avg Daily Revenue</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary neon-glow">
                        ₱{predictiveData.avgDailyRevenue}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on historical data
                      </p>
                    </div>
                  </div>

                  {/* 7-Day Forecast */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-3">7-Day Revenue Forecast</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary neon-glow">
                        ₱{predictiveData.predictedRevenue}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Predicted revenue next week
                      </p>
                    </div>
                  </div>

                  {/* Growth Rate */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-3">Growth Rate</div>
                    </div>
                    <div>
                      <div className={`text-3xl font-bold neon-glow ${Number(predictiveData.growthRate) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {predictiveData.growthRate}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recent vs previous period
                      </p>
                    </div>
                  </div>

                  {/* Peak Hours Info */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-3">Peak Hours</div>
                    </div>
                    <div>
                      {predictiveData.peakHours.length > 0 ? (
                        <div className="space-y-2">
                          {predictiveData.peakHours.map((hour, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-foreground font-medium">{hour.hour}</span>
                              <Badge className="neon-glow-primary">{hour.orders} orders</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* High Demand Items & Recommendations */}
                <div className="grid gap-8 mt-8 md:grid-cols-2">
                  {/* Inventory Recommendations */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-primary neon-glow mb-4">
                        <Package className="h-5 w-5" />
                        Restock Recommendations
                      </CardTitle>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(predictiveData?.itemDemand || {})
                          .sort((a, b) => (b[1]?.quantity || 0) - (a[1]?.quantity || 0))
                          .slice(0, 5)
                          .length > 0 ? (
                          Object.entries(predictiveData?.itemDemand || {})
                            .sort((a, b) => (b[1]?.quantity || 0) - (a[1]?.quantity || 0))
                            .slice(0, 5)
                            .map(([name, data], i) => {
                              const quantity = data?.quantity || 0;
                              const priority = quantity > 50 ? 'high' : quantity > 20 ? 'medium' : 'low';
                              return (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Sold: {quantity} units
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={
                                      priority === 'high' ? 'destructive' : 
                                      priority === 'medium' ? 'secondary' : 
                                      'outline'
                                    }
                                  >
                                    {priority}
                                  </Badge>
                                </div>
                              );
                            })
                        ) : (
                          <p className="text-sm text-muted-foreground">No item data yet</p>
                        )}
                      </div>
                  </div>

                  {/* Business Insights */}
                  <div className="tech-card corner-bracket p-6">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-primary neon-glow mb-4">
                        <TrendingUp className="h-5 w-5" />
                        Business Insights
                      </CardTitle>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <h4 className="font-medium text-sm mb-1">📊 Sales Trend</h4>
                        <p className="text-sm text-foreground">
                          {Number(predictiveData?.growthRate || 0) > 0
                            ? `Your business is growing with a ${predictiveData?.growthRate || 0}% increase in average order value.`
                            : Number(predictiveData?.growthRate || 0) < 0
                            ? `Sales have decreased by ${Math.abs(Number(predictiveData?.growthRate || 0))}%. Consider promotions.`
                            : 'Sales are stable. Maintain current strategy.'}
                        </p>
                      </div>

                      <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                        <h4 className="font-medium text-sm mb-1">🎯 Peak Activity</h4>
                        <p className="text-sm text-foreground">
                          {predictiveData?.peakHours?.length > 0
                            ? `Peak time is ${predictiveData?.peakHours?.[0]?.hour || 'N/A'}. Staff accordingly.`
                            : 'Insufficient data. Continue collecting orders.'}
                        </p>
                      </div>

                      <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                        <h4 className="font-medium text-sm mb-1">💰 Revenue Forecast</h4>
                        <p className="text-sm text-foreground">
                          Predicted 7-day revenue: ₱{predictiveData?.predictedRevenue || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Controls & Data Management */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* System Controls */}
                <div className="tech-card corner-bracket p-6">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary neon-glow mb-4">
                      <Users className="h-5 w-5" />
                      System Controls
                    </CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
                      <div>
                        <h4 className="font-semibold text-sm">Staff Access</h4>
                        <p className="text-xs text-muted-foreground mt-1">Manage user permissions</p>
                      </div>
                      <Button onClick={() => setIsUserManagementOpen(true)} variant="outline" size="sm" className="font-semibold">
                        Manage Users
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
                      <div>
                        <h4 className="font-semibold text-sm">Terminal Settings</h4>
                        <p className="text-xs text-muted-foreground mt-1">Configure POS terminals</p>
                      </div>
                      <Button variant="outline" size="sm" className="font-semibold">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
                      <div>
                        <h4 className="font-semibold text-sm">Network Status</h4>
                        <p className="text-xs text-muted-foreground mt-1">Monitor local network</p>
                      </div>
                      <Badge className="neon-glow-primary">Online</Badge>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div className="tech-card corner-bracket p-6">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary neon-glow mb-4">
                      <Database className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Export Data</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Download order history and sales data for backup or analysis
                      </p>
                      <Button onClick={exportData} className="gap-2 w-full font-semibold neon-glow-primary">
                        <Download className="h-4 w-4" />
                        Export Orders
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Backup System</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                      Create and restore system backups for data protection
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="gap-2 font-semibold">
                          <Upload className="h-4 w-4" />
                          Backup
                        </Button>
                        <Button variant="outline" className="gap-2 font-semibold">
                          <Download className="h-4 w-4" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                            
              {/* Recent Order Activity */}
              <div className="tech-card corner-bracket">
                <CardHeader>
                  <CardTitle className="text-primary neon-glow flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Order Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders yet</p>
                      <p className="text-sm">Order activity will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {orders
                        .slice(-10)
                        .reverse()
                        .map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-lg hover:border-primary/30 transition-all duration-300"
                          >
                            <div>
                              <div className="font-bold text-foreground">Order #{order.orderNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.items.length} items •{' '}
                                {(order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  order.status === 'completed'
                                    ? 'neon-glow-primary'
                                    : order.status === 'ready'
                                    ? 'neon-glow-primary'
                                    : order.status === 'preparing'
                                    ? ''
                                    : '' 
                                }
                                variant={
                                  order.status === 'completed'
                                    ? 'default'
                                    : order.status === 'ready'
                                    ? 'secondary'
                                    : order.status === 'preparing'
                                    ? 'outline'
                                    : 'destructive' 
                                }
                              >
                                {order.status}
                              </Badge>
                              <span className="font-bold text-primary neon-glow">    
                                ₱{order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </div>
            </TabsContent>

            {/* === MENU MANAGEMENT TAB === */}
            <TabsContent value="menu">
              <AdminMenuManagement />
            </TabsContent>

            {/* === ORDER MANAGEMENT TAB === */}
            <TabsContent value="orders">
              <OrderManagement />
            </TabsContent>

            {/* === MENU STOCK LEVELS TAB === */}
            <TabsContent value="menu-inventory">
              <MenuInventory />
            </TabsContent>

            {/* PC Management Tab */}
            <TabsContent value="pc-management">
              <PCManagementAdmin />
            </TabsContent>
          </Tabs>
        </div>

        {/* User Management Modal */}
        <Dialog open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary neon-glow">User Management</DialogTitle>
              <DialogDescription>
                Add and manage staff users with different roles and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Add New User Form */}
              <div className="p-4 bg-muted/50 border border-primary/20 rounded-lg">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add New User
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="border-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Role</label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger className="border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="border-primary/20"
                    />
                  </div>
                  <Button onClick={addUser} disabled={staffLoading} className="w-full gap-2 neon-glow-primary">
                    {staffLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {staffLoading ? 'Adding User...' : 'Add User'}
                  </Button>
                </div>
              </div>

              {/* Users List */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Existing Users ({users.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No users yet. Add one above.
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 bg-muted/30 border border-primary/10 rounded-lg hover:border-primary/30 transition-all"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1">Email</p>
                            <p className="text-sm font-medium text-foreground">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1">Role</p>
                            <Badge className="neon-glow-primary text-xs">{user.role}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1">Password</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-foreground">
                                {showPassword[user.id] ? user.password : '•'.repeat(user.password.length)}
                              </span>
                              <Button
                                onClick={() =>
                                  setShowPassword({ ...showPassword, [user.id]: !showPassword[user.id] })
                                }
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                {showPassword[user.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={() => deleteUser(user.id)}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
