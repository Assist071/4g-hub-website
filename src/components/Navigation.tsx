import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, UserCog, Monitor, ChefHat, BarChart3, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import logo from '../../image logo/4ghubv11.png';

export function Navigation() {
  const location = useLocation();
  const { orders, getPendingOrders } = useOrderStore();
  const { isAdminAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const pendingCount = getPendingOrders().length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  
  // Admin navigation items
  const adminNavItems = [
    {
      to: '/queue',
      icon: Monitor,
      label: 'Order Queue',
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      to: '/kitchen',
      icon: ChefHat,
      label: 'Kitchen',
      badge: preparingCount > 0 ? preparingCount : null
    },
    {
      to: '/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
      badge: null
    },
    {
      to: '/admin',
      icon: UserCog,
      label: 'Admin Panel',
      badge: null
    }
  ];

  const navItems = isAdminAuthenticated ? adminNavItems : [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
            <img src={logo} alt="4G Hub Logo" className="object-contain" style={{ width: '200px', height: '200px' }} />

          </Link>
          
          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {!isAdminAuthenticated && (
              <Button asChild variant={location.pathname === '/admin-login' ? 'default' : 'outline'} className="gap-2">
                <Link to="/admin-login">
                  <UserCog className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Admin Login</span>
                </Link>
              </Button>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Button
                  key={item.to}
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  className="gap-2 relative"
                >
                  <Link to={item.to}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </Button>
              );
            })}
            

          </div>
        </div>
      </div>
    </nav>
  );
}